import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { calculateLevelProgress } from '../../../common/utils/level.util';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { playerProfile: true },
    });

    if (!user || !user.playerProfile) {
      throw new NotFoundException('Профиль не найден');
    }

    const [tournamentsPlayed, wins] = await Promise.all([
      this.prisma.registration.count({
        where: { userId, status: 'FINISHED' },
      }),
      this.prisma.tournamentResult.count({
        where: { userId, place: 1 },
      }),
    ]);

    const levelProgress = calculateLevelProgress(user.playerProfile.xp);

    return {
      id: user.id,
      telegramId: user.telegramId,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      photoUrl: user.photoUrl,
      xp: user.playerProfile.xp,
      ...levelProgress,
      stats: {
        tournamentsPlayed,
        wins,
      },
    };
  }

  async getXpHistory(userId: string) {
    return this.prisma.xPHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { tournamentResult: { include: { tournament: true } } },
    });
  }

  async getTournamentHistory(userId: string) {
    return this.prisma.registration.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { tournament: true },
    });
  }
}
