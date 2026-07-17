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

    const [tournamentsPlayed, results] = await Promise.all([
      this.prisma.registration.count({
        where: { userId, status: 'FINISHED' },
      }),
      this.prisma.tournamentResult.findMany({
        where: { userId },
        select: { place: true },
      }),
    ]);

    const resultsCount = results.length;
    const wins = results.filter((r) => r.place === 1).length;
    const firstPlaces = wins;
    const itm = results.filter((r) => r.place <= 10).length;
    const top10Percent =
      resultsCount > 0 ? Math.round((itm / resultsCount) * 100) : 0;
    const averagePlace =
      resultsCount > 0
        ? Math.round(results.reduce((sum, r) => sum + r.place, 0) / resultsCount)
        : null;
    const daysInClub = Math.max(
      0,
      Math.floor((Date.now() - user.createdAt.getTime()) / 86_400_000),
    );

    const levelProgress = calculateLevelProgress(user.playerProfile.xp);

    return {
      id: user.id,
      telegramId: user.telegramId,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      photoUrl: user.photoUrl,
      xp: user.playerProfile.xp,
      memberSince: user.createdAt.toISOString(),
      isVerified: user.isVerified,
      ...levelProgress,
      stats: {
        tournamentsPlayed,
        wins,
        firstPlaces,
        itm,
        top10Percent,
        averagePlace,
        daysInClub,
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
