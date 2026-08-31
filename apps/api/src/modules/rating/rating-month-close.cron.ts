import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { RatingRewardsService } from './rating-rewards.service';

/**
 * Автозакрытие рейтингового месяца: топ-27 → Финал месяца.
 * 1-го числа в 06:00 Europe/Moscow фиксируем итоги предыдущего месяца.
 */
@Injectable()
export class RatingMonthCloseCron {
  private readonly logger = new Logger(RatingMonthCloseCron.name);

  constructor(private readonly ratingRewardsService: RatingRewardsService) {}

  @Cron('0 6 1 * *', { timeZone: 'Europe/Moscow' })
  async closeMonthAfterMonthEnd(): Promise<void> {
    try {
      const result = await this.ratingRewardsService.closeMonth({}, 'system-cron');
      this.logger.log(
        `Автозакрытие месяца ${result.monthKey}: alreadyClosed=${result.alreadyClosed}, финалистов=${result.qualified.length}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Автозакрытие месяца пропущено: ${message}`);
    }
  }
}
