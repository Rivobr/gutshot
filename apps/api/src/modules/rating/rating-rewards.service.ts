import { Injectable, Logger } from '@nestjs/common';
import { NotificationType, PlayerEventType, RatingPeriodType, XPReason } from '@prisma/client';
import type { XpSettingKey } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { XpService } from '../progression/xp.service';
import { XpSettingsService } from '../progression/xp-settings.service';
import { AchievementEngineService } from '../progression/achievement-engine.service';
import { NotificationsService } from '../telegram/notifications.service';
import { RatingService, type RatingRow } from './rating.service';
import { getPreviousClubMonthBounds, monthKey as clubMonthKey } from './rating-period';

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
 * Итоги месяца: топ-27 месячного рейтинга → Финал месяца,
 * XP-выплата топ-3. Закрытие месяца идемпотентно,
 * повторная выплата за тот же период ничего не начислит.
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

  /** Ключ месяца клуба: 2026-08. */
  static monthKey(date = new Date()): string {
    return clubMonthKey(date);
  }

  /**
   * Закрыть месяц: топ-27 месячного рейтинга получают место в Финале месяца.
   * По умолчанию — предыдущий завершённый месяц.
   */
  async closeMonth(options?: { monthKey?: string; rebuild?: boolean }, adminId?: string | null) {
    const result = await this.ratingService.closeMonth(options);

    if (!result.alreadyClosed || result.rebuilt) {
      for (const player of result.qualified) {
        await this.notifyQualified(player, result.monthKey);
      }
      this.logger.log(
        `Месяц ${result.monthKey} закрыт админом ${adminId ?? 'system'}: ${result.qualified.length} финалистов`,
      );
    }

    return result;
  }

  /**
   * Выплата XP топ-3 по итогам месяца.
   * Берёт зафиксированный топ-27; если месяц ещё не закрыт — живой лидерборд месяца.
   */
  async payoutMonthly(adminId?: string | null) {
    const monthKey = getPreviousClubMonthBounds().monthKey;
    const frozen = await this.ratingService.getMonthFinalists(monthKey);

    const leaderboard =
      frozen.entries.length > 0
        ? frozen.entries
        : (
            await this.ratingService.getPointsLeaderboard(
              getPreviousClubMonthBounds().start,
              getPreviousClubMonthBounds().end,
            )
          ).map((row, index) => ({ ...row, rank: index + 1 }));

    return this.payout(RatingPeriodType.MONTHLY, monthKey, leaderboard, adminId);
  }

  private async payout(
    periodType: RatingPeriodType,
    periodKey: string,
    leaderboard: RatingRow[],
    adminId?: string | null,
  ) {
    const settings = await this.xpSettingsService.getAll();
    const top3 = leaderboard.slice(0, 3);

    const awarded: RewardedPlayer[] = [];
    let skipped = 0;

    for (let index = 0; index < top3.length; index += 1) {
      const place = index + 1;
      const entry = top3[index];
      const xp = settings[MONTHLY_KEYS[place]] ?? 0;

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
          reason: XPReason.MONTHLY_FINAL,
          eventType: PlayerEventType.MONTHLY_FINAL_REWARD,
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

      await this.notifyWinner(player);
    }

    return { periodType, periodKey, awarded, skipped };
  }

  private async notifyQualified(player: RatingRow, monthKey: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: player.userId },
      select: { telegramId: true },
    });

    if (!user) {
      return;
    }

    await this.notificationsService.notify({
      userId: player.userId,
      telegramId: user.telegramId,
      type: NotificationType.SYSTEM,
      title: 'Вы в Финале месяца',
      message:
        `🏆 ${player.finalistPlace ?? player.rank} место рейтинга за ${monthKey}\n` +
        `Топ-27 месяца получают место в Финале месяца.`,
    });
  }

  private async notifyWinner(player: RewardedPlayer): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: player.userId },
      select: { telegramId: true },
    });

    if (!user) {
      return;
    }

    const label = 'итогов месяца';
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
