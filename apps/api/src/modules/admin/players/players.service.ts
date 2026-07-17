import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { calculateLevelProgress } from '../../../common/utils/level.util';

@Injectable()
export class AdminPlayersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const users = await this.prisma.user.findMany({
      include: {
        playerProfile: true,
        _count: {
          select: {
            registrations: { where: { status: 'FINISHED' } },
            tournamentResults: { where: { place: 1 } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((user) => ({
      id: user.id,
      telegramId: user.telegramId,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      photoUrl: user.photoUrl,
      isBlocked: user.isBlocked,
      isVerified: user.isVerified,
      xp: user.playerProfile?.xp ?? 0,
      level: calculateLevelProgress(user.playerProfile?.xp ?? 0).level,
      visits: user._count.registrations,
      wins: user._count.tournamentResults,
      createdAt: user.createdAt,
    }));
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        playerProfile: true,
        registrations: { include: { tournament: true }, orderBy: { createdAt: 'desc' } },
        xpHistory: { orderBy: { createdAt: 'desc' } },
        notifications: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });

    if (!user) {
      throw new NotFoundException('Игрок не найден');
    }

    return { ...user, ...calculateLevelProgress(user.playerProfile?.xp ?? 0) };
  }

  async block(id: string) {
    await this.findById(id);
    return this.prisma.user.update({ where: { id }, data: { isBlocked: true } });
  }

  async unblock(id: string) {
    await this.findById(id);
    return this.prisma.user.update({ where: { id }, data: { isBlocked: false } });
  }

  async setVerified(id: string, isVerified: boolean) {
    await this.findById(id);
    return this.prisma.user.update({ where: { id }, data: { isVerified } });
  }
}
