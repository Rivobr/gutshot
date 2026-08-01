import { Injectable } from '@nestjs/common';
import { XPReason } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { calculateLevelProgress } from '../../common/utils/level.util';
import { buildPlaceRatingScale } from '../../common/constants/xp-defaults.constants';
import { XpSettingsService } from '../progression/xp-settings.service';

/** Очки рейтинга — только места в турнирах (не XP за явку/комбо). */
const RATING_POINT_REASONS: XPReason[] = [XPReason.TOURNAMENT_WIN, XPReason.TOURNAMENT_PLACE];

@Injectable()
export class RatingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly xpSettingsService: XpSettingsService,
  ) {}

  /** Общий прогресс уровня (XP) — не таблица рейтинга. */
  async getOverallRating() {
    const profiles = await this.prisma.playerProfile.findMany({
      orderBy: { xp: 'desc' },
      include: { user: true },
    });

    return profiles.map((profile, index) => ({
      rank: index + 1,
      userId: profile.userId,
      firstName: profile.user.firstName,
      lastName: profile.user.lastName,
      nickname: profile.user.nickname,
      photoUrl: profile.user.photoUrl,
      xp: profile.xp,
      points: profile.xp,
      level: calculateLevelProgress(profile.xp).level,
    }));
  }

  async getWeeklyRating() {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return this.getPointsLeaderboard(weekAgo);
  }

  /** Финал месяца — очки за места с 1-го числа текущего месяца. */
  async getMonthlyFinalRating() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return this.getPointsLeaderboard(monthStart);
  }

  private async getPointsLeaderboard(since: Date) {
    const grouped = await this.prisma.xPHistory.groupBy({
      by: ['userId'],
      where: {
        createdAt: { gte: since },
        reason: { in: RATING_POINT_REASONS },
      },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
    });

    const users = await this.prisma.user.findMany({
      where: { id: { in: grouped.map((g) => g.userId) } },
    });

    const userMap = new Map(users.map((user) => [user.id, user]));

    return grouped.map((entry, index) => {
      const user = userMap.get(entry.userId);
      const points = entry._sum.amount ?? 0;
      return {
        rank: index + 1,
        userId: entry.userId,
        firstName: user?.firstName,
        lastName: user?.lastName,
        nickname: user?.nickname,
        photoUrl: user?.photoUrl,
        weeklyXp: points,
        points,
      };
    });
  }

  /** Шкала очков за места 1–20. */
  async getPlaceScale() {
    const settings = await this.xpSettingsService.getAll();
    return buildPlaceRatingScale(settings);
  }
}
