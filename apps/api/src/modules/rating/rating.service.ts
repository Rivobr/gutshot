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
import {
  WEEKLY_FINAL_TOP,
  getClubMonthBounds,
  getClubWeekBounds,
  getPreviousClubWeekBounds,
  type ClubPeriodBounds,
} from './rating-period';

/** Очки рейтинга — только места в турнирах (не XP за явку/комбо). */
const RATING_POINT_REASONS: XPReason[] = [XPReason.TOURNAMENT_WIN, XPReason.TOURNAMENT_PLACE];

export interface RatingRow {
  rank: number;
  userId: string;
  firstName?: string | null;
  lastName?: string | null;
  nickname?: string | null;
  photoUrl?: string | null;
  username?: string | null;
  points: number;
  weeklyXp?: number;
  level?: number;
  showcaseAchievements?: ShowcaseAchievementDto[];
  qualifiedWeeks?: number;
  weekPlace?: number;
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
      await this.repairQualificationsExcludingHidden();
    } catch (error) {
      this.logger.warn(
        `Не удалось починить финалистов после исключения из рейтинга: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /** Общий прогресс уровня (XP) — не таблица рейтинга. */
  async getOverallRating() {
    const [profiles, thresholds] = await Promise.all([
      this.prisma.playerProfile.findMany({
        where: { user: { hiddenFromRating: false } },
        orderBy: { xp: 'desc' },
        include: { user: true },
      }),
      this.levelsService.getThresholds(),
    ]);

    const base = profiles
      .filter((profile) => !this.isHiddenFromRating(profile.user))
      .map((profile, index) => ({
        rank: index + 1,
        userId: profile.userId,
        firstName: profile.user.firstName,
        lastName: profile.user.lastName,
        nickname: profile.user.nickname,
        photoUrl: profile.user.photoUrl,
        xp: profile.xp,
        points: profile.xp,
        level: this.levelsService.computeProgress(thresholds, profile.xp).level,
      }));

    return this.attachShowcase(base);
  }

  /**
   * Недельный рейтинг клуба (пн–вс, Europe/Moscow).
   * mode=auto: если текущая неделя пустая — отдаём прошлую (чтобы в пн утром таблица не пропадала).
   */
  async getWeeklyRating(mode: 'current' | 'previous' | 'auto' = 'auto'): Promise<{
    weekKey: string;
    monthKey: string;
    period: 'current' | 'previous';
    fallbackFromEmptyCurrent: boolean;
    start: string;
    end: string;
    entries: RatingRow[];
  }> {
    if (mode === 'previous') {
      return this.buildWeeklyRating(getPreviousClubWeekBounds(), 'previous', false);
    }

    const current = getClubWeekBounds();
    const currentEntries = await this.getPointsLeaderboard(current.start, current.end);

    if (mode === 'current' || currentEntries.length > 0) {
      return this.buildWeeklyRating(current, 'current', false, currentEntries);
    }

    const previous = getPreviousClubWeekBounds();
    return this.buildWeeklyRating(previous, 'previous', true);
  }

  private async buildWeeklyRating(
    week: ClubPeriodBounds,
    period: 'current' | 'previous',
    fallbackFromEmptyCurrent: boolean,
    preloaded?: Omit<RatingRow, 'rank'>[],
  ) {
    const rows = preloaded ?? (await this.getPointsLeaderboard(week.start, week.end));
    const ranked = rows.map((row, index) => ({
      ...row,
      rank: index + 1,
      weekPlace: index + 1 <= WEEKLY_FINAL_TOP ? index + 1 : undefined,
    }));
    const entries = await this.attachLevelAndShowcase(ranked);

    return {
      weekKey: week.weekKey,
      monthKey: week.monthKey,
      period,
      fallbackFromEmptyCurrent,
      start: week.start.toISOString(),
      end: week.end.toISOString(),
      entries,
    };
  }

  /**
   * Финалисты месяца: сумма очков только за недели, где игрок вошёл в топ-7.
   * Данные берутся из закрытых недель (WeeklyFinalQualification).
   */
  async getMonthlyFinalRating(): Promise<RatingRow[]> {
    const { monthKey } = getClubMonthBounds();
    const qualifications = await this.prisma.weeklyFinalQualification.findMany({
      where: { monthKey, user: { hiddenFromRating: false } },
      include: { user: true },
    });

    const byUser = new Map<
      string,
      {
        userId: string;
        firstName?: string | null;
        lastName?: string | null;
        nickname?: string | null;
        photoUrl?: string | null;
        username?: string | null;
        points: number;
        qualifiedWeeks: number;
      }
    >();

    for (const row of qualifications) {
      if (this.isHiddenFromRating(row.user)) {
        continue;
      }
      const current = byUser.get(row.userId);
      if (current) {
        current.points += row.weekPoints;
        current.qualifiedWeeks += 1;
      } else {
        byUser.set(row.userId, {
          userId: row.userId,
          firstName: row.user.firstName,
          lastName: row.user.lastName,
          nickname: row.user.nickname,
          photoUrl: row.user.photoUrl,
          username: row.user.username,
          points: row.weekPoints,
          qualifiedWeeks: 1,
        });
      }
    }

    const ranked = Array.from(byUser.values())
      .sort((a, b) => b.points - a.points || a.userId.localeCompare(b.userId))
      .map((entry, index) => ({
        rank: index + 1,
        userId: entry.userId,
        firstName: entry.firstName,
        lastName: entry.lastName,
        nickname: entry.nickname,
        photoUrl: entry.photoUrl,
        username: entry.username,
        points: entry.points,
        weeklyXp: entry.points,
        qualifiedWeeks: entry.qualifiedWeeks,
      }));

    return this.attachLevelAndShowcase(ranked);
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
          weeklyXp: points,
        };
      });
  }

  /**
   * Закрыть неделю: топ-7 переносят свои недельные очки в финал месяца.
   * По умолчанию — предыдущая завершённая неделя. Идемпотентно.
   * Текущую (ещё идущую) неделю без force закрыть нельзя.
   */
  async closeWeek(options?: {
    weekKey?: string;
    target?: 'previous' | 'current';
    force?: boolean;
  }): Promise<{
    weekKey: string;
    monthKey: string;
    alreadyClosed: boolean;
    qualified: RatingRow[];
  }> {
    const week = this.resolveWeekBounds(options);
    const current = getClubWeekBounds();

    if (week.weekKey === current.weekKey && !options?.force) {
      throw new BadRequestException(
        `Неделя ${week.weekKey} ещё идёт. Закрывать можно только после её окончания.`,
      );
    }

    const existing = await this.prisma.weeklyFinalQualification.count({
      where: { weekKey: week.weekKey },
    });

    if (existing > 0) {
      const qualified = await this.listWeekQualifiers(week.weekKey);
      return {
        weekKey: week.weekKey,
        monthKey: week.monthKey,
        alreadyClosed: true,
        qualified,
      };
    }

    const leaderboard = await this.getPointsLeaderboard(week.start, week.end);
    const top = leaderboard.slice(0, WEEKLY_FINAL_TOP).filter((row) => row.points > 0);

    if (top.length === 0) {
      throw new BadRequestException(
        `За неделю ${week.weekKey} нет очков рейтинга — закрывать нечего`,
      );
    }

    await this.prisma.weeklyFinalQualification.createMany({
      data: top.map((row, index) => ({
        weekKey: week.weekKey,
        monthKey: week.monthKey,
        userId: row.userId,
        weekPlace: index + 1,
        weekPoints: row.points,
      })),
    });

    const qualified = await this.listWeekQualifiers(week.weekKey);
    return {
      weekKey: week.weekKey,
      monthKey: week.monthKey,
      alreadyClosed: false,
      qualified,
    };
  }

  async listWeekQualifiers(weekKey: string): Promise<RatingRow[]> {
    const rows = await this.prisma.weeklyFinalQualification.findMany({
      where: { weekKey, user: { hiddenFromRating: false } },
      include: { user: true },
      orderBy: { weekPlace: 'asc' },
    });

    return rows
      .filter((row) => !this.isHiddenFromRating(row.user))
      .map((row, index) => ({
        rank: index + 1,
        userId: row.userId,
        firstName: row.user.firstName,
        lastName: row.user.lastName,
        nickname: row.user.nickname,
        photoUrl: row.user.photoUrl,
        username: row.user.username,
        points: row.weekPoints,
        weeklyXp: row.weekPoints,
        weekPlace: index + 1,
        qualifiedWeeks: 1,
      }));
  }

  /**
   * После исключения владельцев: пересобрать топ-7 закрытых недель,
   * чтобы их слоты заняли следующие игроки.
   */
  async repairQualificationsExcludingHidden(): Promise<void> {
    const weeks = await this.prisma.weeklyFinalQualification.findMany({
      distinct: ['weekKey'],
      select: { weekKey: true },
    });
    if (weeks.length === 0) {
      return;
    }

    for (const { weekKey } of weeks) {
      const bounds = this.resolveWeekBounds({ weekKey });
      const leaderboard = await this.getPointsLeaderboard(bounds.start, bounds.end);
      const top = leaderboard.slice(0, WEEKLY_FINAL_TOP).filter((row) => row.points > 0);

      await this.prisma.$transaction(async (tx) => {
        await tx.weeklyFinalQualification.deleteMany({ where: { weekKey } });
        if (top.length === 0) {
          return;
        }
        await tx.weeklyFinalQualification.createMany({
          data: top.map((row, index) => ({
            weekKey,
            monthKey: bounds.monthKey,
            userId: row.userId,
            weekPlace: index + 1,
            weekPoints: row.points,
          })),
        });
      });
    }

    this.logger.log(`Пересобраны финалисты ${weeks.length} закрытых недель без владельцев клуба`);
  }

  private isHiddenFromRating(user: {
    hiddenFromRating?: boolean;
    username?: string | null;
  }): boolean {
    return Boolean(user.hiddenFromRating) || isRatingExcludedUsername(user.username);
  }

  private resolveWeekBounds(options?: {
    weekKey?: string;
    target?: 'previous' | 'current';
  }): ClubPeriodBounds {
    if (options?.weekKey) {
      let probe = getClubWeekBounds();
      for (let i = 0; i < 80; i += 1) {
        if (probe.weekKey === options.weekKey) {
          return probe;
        }
        probe = getClubWeekBounds(new Date(probe.start.getTime() - 12 * 60 * 60 * 1000));
      }

      probe = getClubWeekBounds();
      for (let i = 0; i < 12; i += 1) {
        if (probe.weekKey === options.weekKey) {
          return probe;
        }
        probe = getClubWeekBounds(new Date(probe.end.getTime() + 12 * 60 * 60 * 1000));
      }

      throw new BadRequestException(`Не удалось найти неделю ${options.weekKey}`);
    }

    if (options?.target === 'current') {
      return getClubWeekBounds();
    }

    return getPreviousClubWeekBounds();
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
