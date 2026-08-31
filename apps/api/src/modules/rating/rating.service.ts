import { BadRequestException, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { XPReason } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { isRatingExcludedUsername } from '../../common/constants/rating-exclusions';
import { buildPlaceRatingScale } from '../../common/constants/xp-defaults.constants';
import {
  buildShowcaseAchievements,
  type ShowcaseAchievementDto,
} from '../../common/utils/showcase-achievements.util';
import { LevelsService } from '../progression/levels.service';
import { XpSettingsService } from '../progression/xp-settings.service';
import { MONTHLY_FINAL_TOP, getClubMonthBounds, getPreviousClubMonthBounds } from './rating-period';

/** Очки рейтинга — места в турнирах и баунти (не XP за явку/комбо). */
export const RATING_POINT_REASONS: XPReason[] = [
  XPReason.TOURNAMENT_WIN,
  XPReason.TOURNAMENT_PLACE,
  XPReason.BOUNTY,
];

export interface RatingRow {
  rank: number;
  userId: string;
  firstName?: string | null;
  lastName?: string | null;
  nickname?: string | null;
  photoUrl?: string | null;
  username?: string | null;
  points: number;
  level?: number;
  showcaseAchievements?: ShowcaseAchievementDto[];
  /** Попадание в топ-27 месяца → место в Финале месяца. */
  finalist?: boolean;
  /** Место внутри топ-27 (1..27), только для финалистов. */
  finalistPlace?: number;
}

@Injectable()
export class RatingService implements OnModuleInit {
  private readonly logger = new Logger(RatingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly xpSettingsService: XpSettingsService,
    private readonly levelsService: LevelsService,
  ) {}

  async onModuleInit() {
    try {
      await this.repairMonthlyFinalistsExcludingHidden();
    } catch (error) {
      this.logger.warn(
        `Не удалось починить финалистов после исключения из рейтинга: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Глобальный рейтинг по XP. Владельцы клуба здесь видны —
   * hiddenFromRating действует только на месячный / финальный рейтинг очков.
   */
  async getOverallRating() {
    const [profiles, thresholds] = await Promise.all([
      this.prisma.playerProfile.findMany({
        where: { user: { isBlocked: false } },
        orderBy: { xp: 'desc' },
        include: { user: true },
      }),
      this.levelsService.getThresholds(),
    ]);

    const base = profiles
      .filter((profile) => !profile.user.isBlocked)
      .map((profile, index) => ({
        rank: index + 1,
        userId: profile.userId,
        firstName: profile.user.firstName,
        lastName: profile.user.lastName,
        nickname: profile.user.nickname,
        photoUrl: profile.user.photoUrl,
        username: profile.user.username,
        xp: profile.xp,
        points: profile.xp,
        level: this.levelsService.computeProgress(thresholds, profile.xp).level,
      }));

    return this.attachShowcase(base);
  }

  /**
   * Месячный рейтинг клуба (календарный месяц, Europe/Moscow).
   * Рейтинг формируется весь месяц: очки за места и баунти во всех турнирах месяца.
   * Топ-27 по итогам месяца получают место в Финале месяца.
   */
  async getMonthlyRating(mode: 'current' | 'previous' = 'current'): Promise<{
    monthKey: string;
    finalistTop: number;
    start: string;
    end: string;
    entries: RatingRow[];
  }> {
    const month = mode === 'previous' ? getPreviousClubMonthBounds() : getClubMonthBounds();
    const rows = await this.getPointsLeaderboard(month.start, month.end);
    const ranked = rows.map((row, index) => {
      const place = index + 1;
      return {
        ...row,
        rank: place,
        finalist: place <= MONTHLY_FINAL_TOP,
        finalistPlace: place <= MONTHLY_FINAL_TOP ? place : undefined,
      };
    });
    const entries = await this.attachLevelAndShowcase(ranked);

    return {
      monthKey: month.monthKey,
      finalistTop: MONTHLY_FINAL_TOP,
      start: month.start.toISOString(),
      end: month.end.toISOString(),
      entries,
    };
  }

  /**
   * Финалисты месяца: зафиксированный топ-27 месячного рейтинга.
   * Данные берутся из закрытых месяцев (MonthlyFinalQualification).
   * Без monthKey — последний закрытый месяц (тот, за чей итог разыгрывается финал).
   */
  async getMonthFinalists(monthKey?: string): Promise<{
    monthKey: string;
    finalistTop: number;
    entries: RatingRow[];
  }> {
    const resolvedKey = monthKey ?? (await this.resolveLatestMonthKey());
    const rows = await this.prisma.monthlyFinalQualification.findMany({
      where: { monthKey: resolvedKey, user: { hiddenFromRating: false } },
      include: { user: true },
      orderBy: { place: 'asc' },
    });

    const entries = await this.attachLevelAndShowcase(
      rows
        .filter((row) => !this.isHiddenFromRating(row.user))
        .map((row) => ({
          userId: row.userId,
          firstName: row.user.firstName,
          lastName: row.user.lastName,
          nickname: row.user.nickname,
          photoUrl: row.user.photoUrl,
          username: row.user.username,
          points: row.points,
          rank: row.place,
          finalist: true,
          finalistPlace: row.place,
        })),
    );

    return { monthKey: resolvedKey, finalistTop: MONTHLY_FINAL_TOP, entries };
  }

  /** Лидерборд очков за места в заданном интервале [start, end). */
  async getPointsLeaderboard(start: Date, end: Date): Promise<Omit<RatingRow, 'rank'>[]> {
    const grouped = await this.prisma.xPHistory.groupBy({
      by: ['userId'],
      where: {
        createdAt: { gte: start, lt: end },
        reason: { in: RATING_POINT_REASONS },
        user: { hiddenFromRating: false },
      },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
    });

    const users = await this.prisma.user.findMany({
      where: { id: { in: grouped.map((g) => g.userId) } },
    });
    const userMap = new Map(users.map((user) => [user.id, user]));

    return grouped
      .filter((entry) => {
        const user = userMap.get(entry.userId);
        return user ? !this.isHiddenFromRating(user) : false;
      })
      .map((entry) => {
        const user = userMap.get(entry.userId);
        const points = entry._sum.amount ?? 0;
        return {
          userId: entry.userId,
          firstName: user?.firstName,
          lastName: user?.lastName,
          nickname: user?.nickname,
          photoUrl: user?.photoUrl,
          username: user?.username,
          points,
        };
      });
  }

  /**
   * Закрыть месяц: топ-27 месячного рейтинга получают место в Финале месяца.
   * По умолчанию — предыдущий завершённый месяц. Идемпотентно.
   * rebuild — пересобрать топ-27, если месяц уже закрыт.
   */
  async closeMonth(options?: { monthKey?: string; rebuild?: boolean }): Promise<{
    monthKey: string;
    alreadyClosed: boolean;
    rebuilt: boolean;
    finalistTop: number;
    qualified: RatingRow[];
  }> {
    const month = this.resolveMonthBounds(options?.monthKey);

    const existing = await this.prisma.monthlyFinalQualification.count({
      where: { monthKey: month.monthKey },
    });

    if (existing > 0 && !options?.rebuild) {
      const { entries } = await this.getMonthFinalists(month.monthKey);
      return {
        monthKey: month.monthKey,
        alreadyClosed: true,
        rebuilt: false,
        finalistTop: MONTHLY_FINAL_TOP,
        qualified: entries,
      };
    }

    const qualified = await this.replaceMonthQualifications(month);
    return {
      monthKey: month.monthKey,
      alreadyClosed: existing > 0,
      rebuilt: existing > 0,
      finalistTop: MONTHLY_FINAL_TOP,
      qualified,
    };
  }

  private async replaceMonthQualifications(month: {
    start: Date;
    end: Date;
    monthKey: string;
  }): Promise<RatingRow[]> {
    const leaderboard = await this.getPointsLeaderboard(month.start, month.end);
    const top = leaderboard.slice(0, MONTHLY_FINAL_TOP).filter((row) => row.points > 0);

    if (top.length === 0) {
      throw new BadRequestException(
        `За месяц ${month.monthKey} нет очков рейтинга — закрывать нечего`,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.monthlyFinalQualification.deleteMany({ where: { monthKey: month.monthKey } });
      await tx.monthlyFinalQualification.createMany({
        data: top.map((row, index) => ({
          monthKey: month.monthKey,
          userId: row.userId,
          place: index + 1,
          points: row.points,
        })),
      });
    });

    const { entries } = await this.getMonthFinalists(month.monthKey);
    return entries;
  }

  /**
   * После исключения владельцев: пересобрать топ-27 закрытых месяцев,
   * чтобы их слоты заняли следующие игроки.
   */
  async repairMonthlyFinalistsExcludingHidden(): Promise<void> {
    const months = await this.prisma.monthlyFinalQualification.findMany({
      distinct: ['monthKey'],
      select: { monthKey: true },
    });
    if (months.length === 0) {
      return;
    }

    for (const { monthKey } of months) {
      const month = this.resolveMonthBounds(monthKey);
      const leaderboard = await this.getPointsLeaderboard(month.start, month.end);
      const top = leaderboard.slice(0, MONTHLY_FINAL_TOP).filter((row) => row.points > 0);

      await this.prisma.$transaction(async (tx) => {
        await tx.monthlyFinalQualification.deleteMany({ where: { monthKey } });
        if (top.length === 0) {
          return;
        }
        await tx.monthlyFinalQualification.createMany({
          data: top.map((row, index) => ({
            monthKey,
            userId: row.userId,
            place: index + 1,
            points: row.points,
          })),
        });
      });
    }

    this.logger.log(`Пересобраны финалисты ${months.length} закрытых месяцев без владельцев клуба`);
  }

  private async resolveLatestMonthKey(): Promise<string> {
    const last = await this.prisma.monthlyFinalQualification.findFirst({
      orderBy: { monthKey: 'desc' },
      select: { monthKey: true },
    });
    if (last) {
      return last.monthKey;
    }
    // Ещё ничего не закрыто — итоги прошлого месяца (можно закрыть вручную).
    return getPreviousClubMonthBounds().monthKey;
  }

  private isHiddenFromRating(user: {
    hiddenFromRating?: boolean;
    username?: string | null;
  }): boolean {
    return Boolean(user.hiddenFromRating) || isRatingExcludedUsername(user.username);
  }

  private resolveMonthBounds(monthKey?: string): {
    start: Date;
    end: Date;
    monthKey: string;
  } {
    if (!monthKey) {
      return getPreviousClubMonthBounds();
    }

    let probe = getPreviousClubMonthBounds();
    for (let i = 0; i < 80; i += 1) {
      if (probe.monthKey === monthKey) {
        return probe;
      }
      probe = getPreviousClubMonthBounds(probe.start);
    }

    probe = getClubMonthBounds();
    for (let i = 0; i < 12; i += 1) {
      if (probe.monthKey === monthKey) {
        return probe;
      }
      probe = getClubMonthBounds(probe.end);
    }

    throw new BadRequestException(`Не удалось найти месяц ${monthKey}`);
  }

  /** Шкала очков за места 1–20. */
  async getPlaceScale() {
    const settings = await this.xpSettingsService.getAll();
    return buildPlaceRatingScale(settings);
  }

  /**
   * Добавляет уровень (по профильному XP) и витрину достижений
   * (закреплённые или топ открытых по редкости).
   */
  private async attachLevelAndShowcase(entries: RatingRow[]): Promise<RatingRow[]> {
    if (entries.length === 0) {
      return entries;
    }

    const userIds = entries.map((entry) => entry.userId);
    const [profiles, unlocked, thresholds] = await Promise.all([
      this.prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          pinnedAchievements: true,
          playerProfile: { select: { xp: true } },
        },
      }),
      this.prisma.playerAchievement.findMany({
        where: { userId: { in: userIds } },
        select: { userId: true, achievementId: true },
      }),
      this.levelsService.getThresholds(),
    ]);

    const profileMap = new Map(profiles.map((user) => [user.id, user]));
    const unlockedByUser = new Map<string, string[]>();
    for (const row of unlocked) {
      const list = unlockedByUser.get(row.userId);
      if (list) {
        list.push(row.achievementId);
      } else {
        unlockedByUser.set(row.userId, [row.achievementId]);
      }
    }

    return entries.map((entry) => {
      const user = profileMap.get(entry.userId);
      const xp = user?.playerProfile?.xp ?? 0;
      return {
        ...entry,
        level: this.levelsService.computeProgress(thresholds, xp).level,
        showcaseAchievements: buildShowcaseAchievements(
          user?.pinnedAchievements,
          unlockedByUser.get(entry.userId) ?? [],
        ),
      };
    });
  }

  /** Только витрина (когда уровень уже посчитан, напр. overall). */
  private async attachShowcase<
    T extends { userId: string; showcaseAchievements?: ShowcaseAchievementDto[] },
  >(entries: T[]): Promise<T[]> {
    if (entries.length === 0) {
      return entries;
    }

    const userIds = entries.map((entry) => entry.userId);
    const [users, unlocked] = await Promise.all([
      this.prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, pinnedAchievements: true },
      }),
      this.prisma.playerAchievement.findMany({
        where: { userId: { in: userIds } },
        select: { userId: true, achievementId: true },
      }),
    ]);

    const pinnedMap = new Map(users.map((user) => [user.id, user.pinnedAchievements]));
    const unlockedByUser = new Map<string, string[]>();
    for (const row of unlocked) {
      const list = unlockedByUser.get(row.userId);
      if (list) {
        list.push(row.achievementId);
      } else {
        unlockedByUser.set(row.userId, [row.achievementId]);
      }
    }

    return entries.map((entry) => ({
      ...entry,
      showcaseAchievements: buildShowcaseAchievements(
        pinnedMap.get(entry.userId),
        unlockedByUser.get(entry.userId) ?? [],
      ),
    }));
  }
}
