import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TelegramInitDataUser } from '../../common/utils/telegram-init-data.util';
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
      return this.prisma.user.update({
        where: { id: existing.id },
        data: {
          username: telegramUser.username,
          firstName: telegramUser.first_name,
          lastName: telegramUser.last_name,
          photoUrl: telegramUser.photo_url,
        },
      });
    }

    return this.prisma.user.create({
      data: {
        telegramId,
        username: telegramUser.username,
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name,
        photoUrl: telegramUser.photo_url,
        playerProfile: { create: { xp: 0 } },
      },
    });
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
}
