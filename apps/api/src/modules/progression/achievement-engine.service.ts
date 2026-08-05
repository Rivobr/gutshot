import { Injectable } from '@nestjs/common';
import { PlayerEventType, XPReason } from '@prisma/client';
import {
  ACHIEVEMENTS_CATALOG,
  achievementProgress,
  isAchievementUnlocked,
  type AchievementMetrics,
} from '../../common/constants/achievements-catalog';
import { PrismaService } from '../../prisma/prisma.service';
import { PrismaTransaction } from '../../common/types/prisma-transaction.type';
import { LevelsService } from './levels.service';
import { XpService } from './xp.service';

export interface UnlockedAchievementResult {
  id: string;
  title: string;
  xp: number;
}

/** Финальный стол — топ-9, ITM — топ-10 (как в статистике профиля). */
const FINAL_TABLE_PLACE = 9;
const TOP10_PLACE = 10;
/** Неделя считается активной, если сыграно не меньше стольких турниров. */
const ACTIVE_WEEK_MIN_TOURNAMENTS = 3;

function isoWeekKey(date: Date): string {
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNumber = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNumber + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const firstDayNumber = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNumber + 3);
  const week = 1 + Math.round((target.getTime() - firstThursday.getTime()) / (7 * 86_400_000));
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

/**
 * Достижения каталога клуба. Метрики считаются из истории игрока,
 * XP за достижение начисляется один раз (уникальный индекс PlayerAchievement).
 */
@Injectable()
export class AchievementEngineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly levelsService: LevelsService,
    private readonly xpService: XpService,
  ) {}

  /** Полный набор метрик игрока для каталога достижений. */
  async collectMetrics(
    client: PrismaService | PrismaTransaction,
    userId: string,
  ): Promise<AchievementMetrics> {
    const db = client as PrismaService;

    const [profile, results, eventCounts, ratingRewards] = await Promise.all([
      db.playerProfile.findUnique({ where: { userId } }),
      db.tournamentResult.findMany({
        where: { userId },
        select: {
          place: true,
          tournamentId: true,
          tournament: { select: { date: true } },
        },
        orderBy: { tournament: { date: 'asc' } },
      }),
      db.playerEvent.groupBy({
        by: ['type'],
        where: { userId },
        _count: { _all: true },
      }),
      db.ratingReward.findMany({
        where: { userId },
        select: { periodType: true, place: true },
      }),
    ]);

    const eventCount = (type: PlayerEventType): number =>
      eventCounts.find((row) => row.type === type)?._count._all ?? 0;

    const wins = results.filter((row) => row.place === 1).length;
    const finalTables = results.filter((row) => row.place <= FINAL_TABLE_PLACE).length;
    const tournamentsPlayed = results.length;

    // Недели с 3+ турнирами.
    const weekBuckets = new Map<string, number>();
    for (const row of results) {
      const key = isoWeekKey(row.tournament.date);
      weekBuckets.set(key, (weekBuckets.get(key) ?? 0) + 1);
    }
    const activeWeeks = Array.from(weekBuckets.values()).filter(
      (count) => count >= ACTIVE_WEEK_MIN_TOURNAMENTS,
    ).length;

    // Серии подряд по хронологии результатов.
    let backToBackWins = 0;
    let winRun = 0;
    let finalTableStreak = 0;
    let finalTableRun = 0;
    let top10Streak = 0;
    let top10Run = 0;

    for (const row of results) {
      if (row.place === 1) {
        winRun += 1;
        backToBackWins = Math.max(backToBackWins, winRun >= 2 ? 1 : 0);
      } else {
        winRun = 0;
      }

      if (row.place <= FINAL_TABLE_PLACE) {
        finalTableRun += 1;
        finalTableStreak = Math.max(finalTableStreak, finalTableRun);
      } else {
        finalTableRun = 0;
      }

      if (row.place <= TOP10_PLACE) {
        top10Run += 1;
        top10Streak = Math.max(top10Streak, top10Run);
      } else {
        top10Run = 0;
      }
    }

    // Победа без повторного входа.
    const winNoReentry = await this.countWinsWithoutReentry(db, userId, results);

    const weeklyRewards = ratingRewards.filter((row) => row.periodType === 'WEEKLY');
    const monthlyRewards = ratingRewards.filter((row) => row.periodType === 'MONTHLY');

    const level = this.levelsService.computeProgress(
      await this.levelsService.getThresholds(),
      profile?.xp ?? 0,
    ).level;

    return {
      wins,
      finalTables,
      tournamentsPlayed,
      activeWeeks,
      weeklyTop3: weeklyRewards.filter((row) => row.place <= 3).length,
      weeklyWins: weeklyRewards.filter((row) => row.place === 1).length,
      monthlyEntries: monthlyRewards.length,
      monthlyPrizes: monthlyRewards.filter((row) => row.place <= 3).length,
      monthlyWins: monthlyRewards.filter((row) => row.place === 1).length,
      fourOfAKind: eventCount(PlayerEventType.FOUR_OF_A_KIND),
      straightFlush: eventCount(PlayerEventType.STRAIGHT_FLUSH),
      royalFlush: eventCount(PlayerEventType.ROYAL_FLUSH),
      knockouts: profile?.bounties ?? 0,
      level,
      winNoReentry,
      backToBackWins,
      finalTableStreak,
      top10Streak,
      shortStackWins: eventCount(PlayerEventType.SHORT_STACK_WIN),
      tutorialCompleted: eventCount(PlayerEventType.TUTORIAL_COMPLETED),
      friendsReferred: eventCount(PlayerEventType.FRIEND_REFERRED),
    };
  }

  private async countWinsWithoutReentry(
    db: PrismaService,
    userId: string,
    results: { place: number; tournamentId: string }[],
  ): Promise<number> {
    const wonTournamentIds = results
      .filter((row) => row.place === 1)
      .map((row) => row.tournamentId);

    if (wonTournamentIds.length === 0) {
      return 0;
    }

    return db.registration.count({
      where: { userId, tournamentId: { in: wonTournamentIds }, reEntries: 0 },
    });
  }

  /**
   * Проверяет каталог и выдаёт новые достижения с начислением XP.
   * Идемпотентно: повторный вызов ничего не начислит.
   */
  async syncForUser(
    userId: string,
    options: { tournamentId?: string | null; performedById?: string | null } = {},
  ): Promise<UnlockedAchievementResult[]> {
    const metrics = await this.collectMetrics(this.prisma, userId);

    const alreadyUnlocked = await this.prisma.playerAchievement.findMany({
      where: { userId },
      select: { achievementId: true },
    });
    const unlockedIds = new Set(alreadyUnlocked.map((row) => row.achievementId));

    const pending = ACHIEVEMENTS_CATALOG.filter(
      (definition) => !unlockedIds.has(definition.id) && isAchievementUnlocked(definition, metrics),
    );

    if (pending.length === 0) {
      return [];
    }

    const granted: UnlockedAchievementResult[] = [];

    for (const definition of pending) {
      await this.prisma.$transaction(async (tx) => {
        // Гонки исключены уникальным индексом: дубль просто не создастся.
        const existing = await tx.playerAchievement.findUnique({
          where: { userId_achievementId: { userId, achievementId: definition.id } },
        });

        if (existing) {
          return;
        }

        await tx.playerAchievement.create({
          data: { userId, achievementId: definition.id, xpAwarded: definition.xp },
        });

        await this.xpService.award(tx, {
          userId,
          amount: definition.xp,
          reason: XPReason.ACHIEVEMENT,
          eventType: PlayerEventType.ACHIEVEMENT_UNLOCKED,
          tournamentId: options.tournamentId ?? null,
          performedById: options.performedById ?? null,
          metadata: { achievementId: definition.id, title: definition.title, xp: definition.xp },
        });

        granted.push({ id: definition.id, title: definition.title, xp: definition.xp });
      });
    }

    // «Легенда» и уровневые достижения могут открыться от начисленного XP.
    if (granted.length > 0) {
      const cascade = await this.syncForUser(userId, options);
      granted.push(...cascade);
    }

    return granted;
  }

  async listUnlocked(userId: string): Promise<string[]> {
    const rows = await this.prisma.playerAchievement.findMany({
      where: { userId },
      select: { achievementId: true },
    });
    return rows.map((row) => row.achievementId);
  }

  /** Прогресс по каждому достижению каталога: id → сколько из target выполнено. */
  buildProgressMap(metrics: AchievementMetrics): Record<string, number> {
    const progress: Record<string, number> = {};

    for (const definition of ACHIEVEMENTS_CATALOG) {
      progress[definition.id] = achievementProgress(definition, metrics);
    }

    return progress;
  }
}
