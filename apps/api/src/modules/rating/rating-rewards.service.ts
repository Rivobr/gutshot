import { Injectable, Logger } from '@nestjs/common';
import { NotificationType, PlayerEventType, RatingPeriodType, XPReason } from '@prisma/client';
import type { XpSettingKey } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { XpService } from '../progression/xp.service';
import { XpSettingsService } from '../progression/xp-settings.service';
import { AchievementEngineService } from '../progression/achievement-engine.service';
import { NotificationsService } from '../telegram/notifications.service';
import { RatingService } from './rating.service';

const WEEKLY_KEYS: Record<number, XpSettingKey> = {
  1: 'WEEKLY_TOP_1' as XpSettingKey,
  2: 'WEEKLY_TOP_2' as XpSettingKey,
  3: 'WEEKLY_TOP_3' as XpSettingKey,
};

const MONTHLY_KEYS: Record<number, XpSettingKey> = {
  1: 'MONTHLY_TOP_1' as XpSettingKey,
  2: 'MONTHLY_TOP_2' as XpSettingKey,
  3: 'MONTHLY_TOP_3' as XpSettingKey,
};

export interface RewardedPlayer {
  userId: string;
  place: number;
  xp: number;
  nickname?: string | null;
  firstName?: string | null;
}

/**
 * Награды за недельный рейтинг и финал месяца (ТЗ клуба).
 * Выплата идемпотентна: повторный запуск за тот же период ничего не начислит.
 */
@Injectable()
export class RatingRewardsService {
  private readonly logger = new Logger(RatingRewardsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ratingService: RatingService,
    private readonly xpService: XpService,
    private readonly xpSettingsService: XpSettingsService,
    private readonly achievementEngine: AchievementEngineService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /** Ключ ISO-недели: 2026-W32. */
  static weekKey(date = new Date()): string {
    const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const dayNumber = (target.getUTCDay() + 6) % 7;
    target.setUTCDate(target.getUTCDate() - dayNumber + 3);
    const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
    const firstDayNumber = (firstThursday.getUTCDay() + 6) % 7;
    firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNumber + 3);
    const week = 1 + Math.round((target.getTime() - firstThursday.getTime()) / (7 * 86_400_000));
    return `${target.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
  }

  /** Ключ месяца: 2026-08. */
  static monthKey(date = new Date()): string {
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
  }

  async payoutWeekly(adminId?: string | null) {
    const leaderboard = await this.ratingService.getWeeklyRating();
    return this.payout(
      RatingPeriodType.WEEKLY,
      RatingRewardsService.weekKey(),
      leaderboard,
      adminId,
    );
  }

  async payoutMonthly(adminId?: string | null) {
    const leaderboard = await this.ratingService.getMonthlyFinalRating();
    return this.payout(
      RatingPeriodType.MONTHLY,
      RatingRewardsService.monthKey(),
      leaderboard,
      adminId,
    );
  }

  private async payout(
    periodType: RatingPeriodType,
    periodKey: string,
    leaderboard: { userId: string; nickname?: string | null; firstName?: string | null }[],
    adminId?: string | null,
  ) {
    const keys = periodType === RatingPeriodType.WEEKLY ? WEEKLY_KEYS : MONTHLY_KEYS;
    const settings = await this.xpSettingsService.getAll();
    const top3 = leaderboard.slice(0, 3);

    const awarded: RewardedPlayer[] = [];
    let skipped = 0;

    for (let index = 0; index < top3.length; index += 1) {
      const place = index + 1;
      const entry = top3[index];
      const xp = settings[keys[place]] ?? 0;

      const existing = await this.prisma.ratingReward.findUnique({
        where: {
          userId_periodType_periodKey: { userId: entry.userId, periodType, periodKey },
        },
      });

      if (existing) {
        skipped += 1;
        continue;
      }

      await this.prisma.$transaction(async (tx) => {
        await tx.ratingReward.create({
          data: { userId: entry.userId, periodType, periodKey, place, xpAwarded: xp },
        });

        await this.xpService.award(tx, {
          userId: entry.userId,
          amount: xp,
          reason:
            periodType === RatingPeriodType.WEEKLY
              ? XPReason.WEEKLY_RATING
              : XPReason.MONTHLY_FINAL,
          eventType:
            periodType === RatingPeriodType.WEEKLY
              ? PlayerEventType.WEEKLY_RATING_REWARD
              : PlayerEventType.MONTHLY_FINAL_REWARD,
          performedById: adminId ?? null,
          metadata: { periodType, periodKey, place, xp },
        });
      });

      awarded.push({
        userId: entry.userId,
        place,
        xp,
        nickname: entry.nickname,
        firstName: entry.firstName,
      });
    }

    // Достижения за топ-3 / победы в периоде.
    for (const player of awarded) {
      try {
        await this.achievementEngine.syncForUser(player.userId, { performedById: adminId ?? null });
      } catch (error) {
        this.logger.warn(
          `Не удалось пересчитать достижения для ${player.userId}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }

      await this.notifyWinner(player, periodType);
    }

    return { periodType, periodKey, awarded, skipped };
  }

  private async notifyWinner(player: RewardedPlayer, periodType: RatingPeriodType): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: player.userId },
      select: { telegramId: true },
    });

    if (!user) {
      return;
    }

    const label = periodType === RatingPeriodType.WEEKLY ? 'недельного рейтинга' : 'финала месяца';
    const medal = player.place === 1 ? '🥇' : player.place === 2 ? '🥈' : '🥉';

    await this.notificationsService.notify({
      userId: player.userId,
      telegramId: user.telegramId,
      type: NotificationType.SYSTEM,
      title: `Награда ${label}`,
      message: `${medal} ${player.place} место ${label}!\nНачислено +${player.xp} XP.`,
    });
  }

  /** История наград игрока. */
  async findByUser(userId: string) {
    return this.prisma.ratingReward.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
