import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TelegramInitDataUser } from '../../common/utils/telegram-init-data.util';
import { generatePlayerQrCode } from '../../common/utils/player-qr.util';
import { TelegramService } from '../telegram/telegram.service';
import { User } from '@prisma/client';

function defaultNickname(telegramUser: TelegramInitDataUser): string | null {
  const fromName = [telegramUser.first_name, telegramUser.last_name]
    .filter(Boolean)
    .join(' ')
    .trim();
  if (fromName) {
    return fromName.slice(0, 32);
  }
  if (telegramUser.username?.trim()) {
    return telegramUser.username.trim().slice(0, 32);
  }
  return null;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly telegramService: TelegramService,
  ) {}

  async findByTelegramId(telegramId: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { telegramId: String(telegramId) } });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findOrCreateFromTelegram(telegramUser: TelegramInitDataUser): Promise<User> {
    const telegramId = String(telegramUser.id);
    const existing = await this.findByTelegramId(telegramId);
    const photoUrl =
      (await this.telegramService.getUserProfilePhotoUrl(telegramId)) ??
      telegramUser.photo_url ??
      null;

    if (existing) {
      // Никнейм не трогаем — его меняет только сам игрок.
      // QR-код тоже никогда не перегенерируется.
      const updated = await this.prisma.user.update({
        where: { id: existing.id },
        data: {
          username: telegramUser.username,
          firstName: telegramUser.first_name,
          lastName: telegramUser.last_name,
          photoUrl: photoUrl ?? existing.photoUrl,
          nickname: existing.nickname ?? defaultNickname(telegramUser),
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
        nickname: defaultNickname(telegramUser),
        photoUrl,
        qrCode: generatePlayerQrCode(),
        playerProfile: { create: { xp: 0 } },
      },
    });
  }

  async updateNickname(userId: string, nickname: string): Promise<User> {
    const normalized = nickname.trim().replace(/\s+/g, ' ');

    if (normalized.length < 2 || normalized.length > 32) {
      throw new BadRequestException('Никнейм должен быть от 2 до 32 символов');
    }

    if (!/^[\p{L}\p{N} _.\-]+$/u.test(normalized)) {
      throw new BadRequestException('Никнейм содержит недопустимые символы');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { nickname: normalized },
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
