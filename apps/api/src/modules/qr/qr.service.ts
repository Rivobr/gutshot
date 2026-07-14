import { Injectable, NotFoundException } from '@nestjs/common';
import { customAlphabet } from 'nanoid';
import { PrismaService } from '../../prisma/prisma.service';
import { QR_TTL_SECONDS } from '../../common/constants/qr.constants';
import { QRToken } from '@prisma/client';

const generateToken = customAlphabet(
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  48,
);

@Injectable()
export class QrService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Возвращает действующий QR для регистрации, создавая новый,
   * если предыдущего нет или он истек. Предыдущий токен становится недействительным.
   */
  async getOrCreateActiveToken(registrationId: string): Promise<QRToken> {
    const existing = await this.prisma.qRToken.findUnique({ where: { registrationId } });

    if (existing && !existing.usedAt && existing.expiresAt > new Date()) {
      return existing;
    }

    const expiresAt = new Date(Date.now() + QR_TTL_SECONDS * 1000);

    if (existing) {
      return this.prisma.qRToken.update({
        where: { registrationId },
        data: { token: generateToken(), expiresAt, usedAt: null },
      });
    }

    return this.prisma.qRToken.create({
      data: { registrationId, token: generateToken(), expiresAt },
    });
  }

  async invalidate(registrationId: string): Promise<void> {
    await this.prisma.qRToken.updateMany({
      where: { registrationId },
      data: { usedAt: new Date() },
    });
  }

  async validateAndConsume(token: string): Promise<QRToken> {
    const qrToken = await this.prisma.qRToken.findUnique({ where: { token } });

    if (!qrToken) {
      throw new NotFoundException('QR-код не найден');
    }

    if (qrToken.usedAt) {
      throw new NotFoundException('QR-код уже использован');
    }

    if (qrToken.expiresAt < new Date()) {
      throw new NotFoundException('QR-код просрочен');
    }

    return this.prisma.qRToken.update({
      where: { id: qrToken.id },
      data: { usedAt: new Date() },
    });
  }
}
