import { BadRequestException, HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { createHash, randomInt } from 'crypto';
import { OtpPurpose, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const CODE_TTL_SECONDS = 5 * 60;
const RESEND_INTERVAL_SECONDS = 60;
const MAX_ATTEMPTS = 5;

export interface OtpRequestResult {
  resendAfterSeconds: number;
}

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Выдать код: не чаще раза в 60 секунд на номер, живёт 5 минут. */
  async issue(
    phone: string,
    purpose: OtpPurpose,
    send: (phone: string, code: string) => Promise<boolean>,
  ): Promise<OtpRequestResult> {
    const last = await this.prisma.phoneOtpCode.findFirst({
      where: {
        phone,
        purpose,
        createdAt: { gt: new Date(Date.now() - RESEND_INTERVAL_SECONDS * 1000) },
      },
      select: { id: true },
    });

    if (last) {
      throw new HttpException(
        'Код уже отправлен. Повторно — через минуту.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const code = String(randomInt(100000, 999999));
    await this.prisma.phoneOtpCode.updateMany({
      where: { phone, purpose, consumedAt: null },
      data: { consumedAt: new Date() },
    });
    await this.prisma.phoneOtpCode.create({
      data: {
        phone,
        purpose,
        codeHash: this.hash(phone, code),
        expiresAt: new Date(Date.now() + CODE_TTL_SECONDS * 1000),
      },
    });

    const delivered = await send(
      phone,
      `GUTSHOT: код ${code}. Никому его не сообщайте. Действует 5 минут.`,
    );
    if (!delivered) {
      this.logger.warn(`SMS для ${phone} не доставлена`);
    }

    return { resendAfterSeconds: RESEND_INTERVAL_SECONDS };
  }

  /** Проверить код. При успехе помечает использованным. */
  async verify(phone: string, purpose: OtpPurpose, code: string): Promise<void> {
    const row = await this.prisma.phoneOtpCode.findFirst({
      where: {
        phone,
        purpose,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: Prisma.SortOrder.desc },
    });

    if (!row) {
      throw new BadRequestException('Код не найден или истёк. Запросите новый.');
    }

    if (row.attempts >= MAX_ATTEMPTS) {
      throw new BadRequestException('Слишком много попыток. Запросите новый код.');
    }

    if (row.codeHash !== this.hash(phone, code.trim())) {
      await this.prisma.phoneOtpCode.update({
        where: { id: row.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException('Неверный код');
    }

    await this.prisma.phoneOtpCode.update({
      where: { id: row.id },
      data: { consumedAt: new Date() },
    });
  }

  private hash(phone: string, code: string): string {
    return createHash('sha256').update(`${phone}:${code}`).digest('hex');
  }
}
