import { BadRequestException, Injectable } from '@nestjs/common';
import { XPReason } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { buildPlaceRatingScale } from '../../common/constants/xp-defaults.constants';
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
  qualifiedWeeks?: number;
  weekPlace?: number;
}

@Injectable()
export class RatingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly xpSettingsService: XpSettingsService,
    private readonly levelsService: LevelsService,
  ) {}

  /** Общий прогресс уровня (XP) — не таблица рейтинга. */
  async getOverallRating() {
    const [profiles, thresholds] = await Promise.all([
      this.prisma.playerProfile.findMany({
        orderBy: { xp: 'desc' },
        include: { user: true },
      }),
      this.levelsService.getThresholds(),
    ]);

    return profiles.map((profile, index) => ({
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
  }

  /** Живой рейтинг текущей ISO-недели клуба (пн–вс, Europe/Moscow). */
  async getWeeklyRating(): Promise<RatingRow[]> {
    const week = getClubWeekBounds();
    const rows = await this.getPointsLeaderboard(week.start, week.end);
    return rows.map((row, index) => ({
      ...row,
      rank: index + 1,
      weekPlace: index + 1 <= WEEKLY_FINAL_TOP ? index + 1 : undefined,
    }));
  }

  /**
   * Финалисты месяца: сумма очков только за недели, где игрок вошёл в топ-7.
   * Данные берутся из закрытых недель (WeeklyFinalQualification).
   */
  async getMonthlyFinalRating(): Promise<RatingRow[]> {
    const { monthKey } = getClubMonthBounds();
    const qualifications = await this.prisma.weeklyFinalQualification.findMany({
      where: { monthKey },
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

    return Array.from(byUser.values())
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
  }

  /** Лидерборд очков за места в заданном интервале [start, end). */
  async getPointsLeaderboard(start: Date, end: Date): Promise<Omit<RatingRow, 'rank'>[]> {
    const grouped = await this.prisma.xPHistory.groupBy({
      by: ['userId'],
      where: {
        createdAt: { gte: start, lt: end },
        reason: { in: RATING_POINT_REASONS },
      },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
    });

    const users = await this.prisma.user.findMany({
      where: { id: { in: grouped.map((g) => g.userId) } },
    });
    const userMap = new Map(users.map((user) => [user.id, user]));

    return grouped.map((entry) => {
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
   */
  async closeWeek(options?: { weekKey?: string; target?: 'previous' | 'current' }): Promise<{
    weekKey: string;
    monthKey: string;
    alreadyClosed: boolean;
    qualified: RatingRow[];
  }> {
    const week = this.resolveWeekBounds(options);
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
      where: { weekKey },
      include: { user: true },
      orderBy: { weekPlace: 'asc' },
    });

    return rows.map((row) => ({
      rank: row.weekPlace,
      userId: row.userId,
      firstName: row.user.firstName,
      lastName: row.user.lastName,
      nickname: row.user.nickname,
      photoUrl: row.user.photoUrl,
      username: row.user.username,
      points: row.weekPoints,
      weeklyXp: row.weekPoints,
      weekPlace: row.weekPlace,
      qualifiedWeeks: 1,
    }));
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
}
