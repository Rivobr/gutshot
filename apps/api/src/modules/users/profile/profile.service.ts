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

  /**
   * Лёгкий bootstrap для входа Mini App.
   * Один SELECT (+ при необходимости создание пустого PlayerProfile).
   * Без metrics / achievements / истории — это грузится через getProfile после Home.
   */
  async getBootstrap(userId: string) {
    let user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        telegramId: true,
        username: true,
        firstName: true,
        lastName: true,
        nickname: true,
        photoUrl: true,
        consentAcceptedAt: true,
        playerProfile: { select: { xp: true } },
      },
    });

    if (!user) {
      throw new NotFoundException('Профиль не найден');
    }

    if (!user.playerProfile) {
      await this.prisma.playerProfile.create({
        data: { userId: user.id, xp: 0 },
      });
      user = await this.prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: {
          id: true,
          telegramId: true,
          username: true,
          firstName: true,
          lastName: true,
          nickname: true,
          photoUrl: true,
          consentAcceptedAt: true,
          playerProfile: { select: { xp: true } },
        },
      });
    }

    return {
      id: user.id,
      telegramId: user.telegramId,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      nickname: user.nickname,
      photoUrl: user.photoUrl,
      xp: user.playerProfile?.xp ?? 0,
      consentAcceptedAt: user.consentAcceptedAt ? user.consentAcceptedAt.toISOString() : null,
    };
  }

  async getProfile(userId: string) {
    const core = await this.loadProfileCore(userId, { ensureQr: true, allowBlocked: true });

    return {
      id: core.id,
      telegramId: core.telegramId,
      username: core.username,
      firstName: core.firstName,
      lastName: core.lastName,
      nickname: core.nickname,
      photoUrl: core.photoUrl,
      xp: core.xp,
      memberSince: core.memberSince,
      isVerified: core.isVerified,
      qrCode: core.qrCode,
      consentAcceptedAt: core.consentAcceptedAt,
      isLegendGutshot: core.isLegendGutshot,
      pinnedAchievements: core.pinnedAchievements,
      level: core.level,
      currentLevelXp: core.currentLevelXp,
      nextLevelXp: core.nextLevelXp,
      progress: core.progress,
      stats: core.stats,
      unlockedAchievements: core.unlockedAchievements,
      achievementProgress: core.achievementProgress,
    };
  }

  /**
   * Публичный профиль другого игрока.
   * Без telegramId, QR, согласия, полной истории и прогресса всех ачивок.
   */
  async getPublicProfile(userId: string) {
    const core = await this.loadProfileCore(userId, { ensureQr: false, allowBlocked: false });

    return {
      id: core.id,
      username: core.username,
      firstName: core.firstName,
      lastName: core.lastName,
      nickname: core.nickname,
      photoUrl: core.photoUrl,
      level: core.level,
      xp: core.xp,
      currentLevelXp: core.currentLevelXp,
      nextLevelXp: core.nextLevelXp,
      progress: core.progress,
      memberSince: core.memberSince,
      isVerified: core.isVerified,
      isLegendGutshot: core.isLegendGutshot,
      pinnedAchievements: core.pinnedAchievements,
      stats: {
        tournamentsPlayed: core.stats.tournamentsPlayed,
        wins: core.stats.wins,
        firstPlaces: core.stats.firstPlaces,
        itm: core.stats.itm,
        top10Percent: core.stats.top10Percent,
        averagePlace: core.stats.averagePlace,
        daysInClub: core.stats.daysInClub,
        finalTables: core.stats.finalTables,
      },
    };
  }

  private async loadProfileCore(
    userId: string,
    options: { ensureQr: boolean; allowBlocked: boolean },
  ) {
    let user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { playerProfile: true },
    });

    if (!user || (!options.allowBlocked && user.isBlocked)) {
      throw new NotFoundException('Профиль не найден');
    }

    // Старые/битые записи без PlayerProfile — чиним на лету.
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

    const qrCode = options.ensureQr
      ? (user.qrCode ?? (await this.usersService.ensureQrCode(user.id)).qrCode)
      : (user.qrCode ?? '');

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
      consentAcceptedAt: user.consentAcceptedAt
        ? user.consentAcceptedAt.toISOString()
        : user.consentAcceptedAt,
      isLegendGutshot: unlockedAchievements.includes('legend_gutshot'),
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
