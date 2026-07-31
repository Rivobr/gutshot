import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TelegramInitDataUser } from '../../common/utils/telegram-init-data.util';
import { generatePlayerQrCode } from '../../common/utils/player-qr.util';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByTelegramId(telegramId: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { telegramId: String(telegramId) } });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findOrCreateFromTelegram(telegramUser: TelegramInitDataUser): Promise<User> {
    const telegramId = String(telegramUser.id);
    const existing = await this.findByTelegramId(telegramId);

    if (existing) {
      // Персональный QR-код никогда не перегенерируется при обновлении профиля.
      // Он лишь дозаполняется для пользователей, созданных до его появления.
      const updated = await this.prisma.user.update({
        where: { id: existing.id },
        data: {
          username: telegramUser.username,
          firstName: telegramUser.first_name,
          lastName: telegramUser.last_name,
          photoUrl: telegramUser.photo_url,
        },
      });

      return updated.qrCode ? updated : this.ensureQrCode(updated.id);
    }

    return this.prisma.user.create({
      data: {
        telegramId,
        username: telegramUser.username,
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name,
        photoUrl: telegramUser.photo_url,
        qrCode: generatePlayerQrCode(),
        playerProfile: { create: { xp: 0 } },
      },
    });
  }

  /**
   * Гарантирует наличие постоянного QR-кода. Если код уже выдан — возвращает
   * пользователя без изменений, поэтому вызов идемпотентен.
   */
  async ensureQrCode(userId: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    if (user.qrCode) {
      return user;
    }

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const candidate = generatePlayerQrCode();
      const taken = await this.prisma.user.findUnique({ where: { qrCode: candidate } });

      if (taken) {
        continue;
      }

      return this.prisma.user.update({ where: { id: userId }, data: { qrCode: candidate } });
    }

    throw new NotFoundException('Не удалось выдать QR-код, повторите попытку');
  }

  async findAll(params: { skip?: number; take?: number }): Promise<User[]> {
    return this.prisma.user.findMany({
      skip: params.skip,
      take: params.take,
      include: { playerProfile: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async block(userId: string): Promise<User> {
    return this.prisma.user.update({ where: { id: userId }, data: { isBlocked: true } });
  }

  async unblock(userId: string): Promise<User> {
    return this.prisma.user.update({ where: { id: userId }, data: { isBlocked: false } });
  }

  /** Фиксирует принятие пользовательских соглашений. */
  async acceptConsent(userId: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    if (user.consentAcceptedAt) {
      return user;
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { consentAcceptedAt: new Date() },
    });
  }

  /** Сброс согласия администратором — экран приветствия покажется снова. */
  async resetConsent(userId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { consentAcceptedAt: null },
    });
  }
}
