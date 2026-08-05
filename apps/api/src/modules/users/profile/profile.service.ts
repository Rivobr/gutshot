import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { LevelsService } from '../../progression/levels.service';
import { PlayerEventsService } from '../../progression/player-events.service';
import { AchievementsService } from '../../progression/achievements.service';
import { AchievementEngineService } from '../../progression/achievement-engine.service';
import { UsersService } from '../users.service';

/** Сколько достижений игрок может закрепить в профиле. */
export const MAX_PINNED_ACHIEVEMENTS = 3;

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly levelsService: LevelsService,
    private readonly playerEventsService: PlayerEventsService,
    private readonly achievementsService: AchievementsService,
    private readonly achievementEngine: AchievementEngineService,
  ) {}

  async getProfile(userId: string) {
    let user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { playerProfile: true },
    });

    if (!user) {
      throw new NotFoundException('Профиль не найден');
    }

    // Старые/битые записи без PlayerProfile — чиним на лету, иначе 404 и «вечная» ошибка входа.
    if (!user.playerProfile) {
      await this.prisma.playerProfile.create({
        data: { userId: user.id, xp: 0 },
      });
      user = await this.prisma.user.findUniqueOrThrow({
        where: { id: userId },
        include: { playerProfile: true },
      });
    }

    if (!user.playerProfile) {
      throw new NotFoundException('Профиль не найден');
    }

    // Постоянный QR выдается один раз; для игроков, созданных до его появления,
    // код дозаполняется здесь и далее уже не меняется.
    const qrCode = user.qrCode ?? (await this.usersService.ensureQrCode(user.id)).qrCode;

    const [
      resultsCount,
      itm,
      placeAvg,
      visits,
      placeHistory,
      levelProgress,
      metrics,
      unlockedAchievements,
    ] = await Promise.all([
      this.prisma.tournamentResult.count({ where: { userId } }),
      this.prisma.tournamentResult.count({
        where: { userId, place: { lte: 10 } },
      }),
      this.prisma.tournamentResult.aggregate({
        where: { userId },
        _avg: { place: true },
      }),
      this.prisma.playerEvent.count({
        where: { userId, type: 'ARRIVED' },
      }),
      this.prisma.tournamentResult.findMany({
        where: { userId },
        select: { place: true, tournament: { select: { date: true } } },
        orderBy: { tournament: { date: 'asc' } },
      }),
      this.levelsService.getProgress(user.playerProfile.xp),
      this.achievementEngine.collectMetrics(this.prisma, userId),
      this.achievementEngine.listUnlocked(userId),
    ]);

    const tournamentsPlayed = metrics.tournamentsPlayed;
    const wins = metrics.wins;
    const finalTables = metrics.finalTables;

    let winStreak = 0;
    let currentStreak = 0;
    for (const row of placeHistory) {
      if (row.place === 1) {
        currentStreak += 1;
        winStreak = Math.max(winStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    const firstPlaces = wins;
    const top10Percent = resultsCount > 0 ? Math.round((itm / resultsCount) * 100) : 0;
    const averagePlace = placeAvg._avg.place != null ? Math.round(placeAvg._avg.place) : null;
    const daysInClub = Math.max(
      0,
      Math.floor((Date.now() - user.createdAt.getTime()) / 86_400_000),
    );

    return {
      id: user.id,
      telegramId: user.telegramId,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      nickname: user.nickname,
      photoUrl: user.photoUrl,
      xp: user.playerProfile.xp,
      memberSince: user.createdAt.toISOString(),
      isVerified: user.isVerified,
      qrCode,
      consentAcceptedAt: user.consentAcceptedAt,
      pinnedAchievements: user.pinnedAchievements,
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
        visits,
        finalTables,
        winStreak,
        fourOfAKind: metrics.fourOfAKind,
        straightFlush: metrics.straightFlush,
        royalFlush: metrics.royalFlush,
        activeWeeks: metrics.activeWeeks,
        weeklyTop3: metrics.weeklyTop3,
        weeklyWins: metrics.weeklyWins,
        monthlyEntries: metrics.monthlyEntries,
        monthlyPrizes: metrics.monthlyPrizes,
        monthlyWins: metrics.monthlyWins,
        winNoReentry: metrics.winNoReentry,
        backToBackWins: metrics.backToBackWins,
        finalTableStreak: metrics.finalTableStreak,
        top10Streak: metrics.top10Streak,
        shortStackWins: metrics.shortStackWins,
        tutorialCompleted: metrics.tutorialCompleted,
        friendsReferred: metrics.friendsReferred,
        knockouts: metrics.knockouts,
      },
      unlockedAchievements,
      achievementProgress: this.achievementEngine.buildProgressMap(metrics),
    };
  }

  /** Витрина достижений в профиле: показывается другим игрокам. */
  async setPinnedAchievements(userId: string, achievementIds: string[]) {
    const unique = Array.from(new Set(achievementIds)).slice(0, MAX_PINNED_ACHIEVEMENTS);
    await this.prisma.user.update({
      where: { id: userId },
      data: { pinnedAchievements: unique },
    });
    return { pinnedAchievements: unique };
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
