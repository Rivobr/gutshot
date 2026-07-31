import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { LevelsService } from '../../progression/levels.service';
import { PlayerEventsService } from '../../progression/player-events.service';
import { AchievementsService } from '../../progression/achievements.service';
import { UsersService } from '../users.service';

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly levelsService: LevelsService,
    private readonly playerEventsService: PlayerEventsService,
    private readonly achievementsService: AchievementsService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { playerProfile: true },
    });

    if (!user || !user.playerProfile) {
      throw new NotFoundException('Профиль не найден');
    }

    // Постоянный QR выдается один раз; для игроков, созданных до его появления,
    // код дозаполняется здесь и далее уже не меняется.
    const qrCode = user.qrCode ?? (await this.usersService.ensureQrCode(user.id)).qrCode;

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

    const levelProgress = await this.levelsService.getProgress(user.playerProfile.xp);

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
      qrCode,
      consentAcceptedAt: user.consentAcceptedAt,
      ...levelProgress,
      stats: {
        tournamentsPlayed,
        wins,
        firstPlaces,
        itm,
        top10Percent,
        averagePlace,
        daysInClub,
        reEntries: user.playerProfile.reEntries,
        bounties: user.playerProfile.bounties,
      },
    };
  }

  /** Постоянный персональный QR-код игрока. */
  async getQrCode(userId: string) {
    const user = await this.usersService.ensureQrCode(userId);
    return { qrCode: user.qrCode };
  }

  async getXpHistory(userId: string) {
    return this.prisma.xPHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { tournamentResult: { include: { tournament: true } } },
    });
  }

  /** Полная история активности игрока. */
  async getEvents(userId: string, take?: number, skip?: number) {
    return this.playerEventsService.findMany({ userId, take, skip });
  }

  async getAchievements(userId: string) {
    return this.achievementsService.findByUser(userId);
  }

  async getTournamentHistory(userId: string) {
    return this.prisma.registration.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { tournament: true },
    });
  }
}
