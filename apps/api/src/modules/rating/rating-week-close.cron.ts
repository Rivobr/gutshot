import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { RatingRewardsService } from './rating-rewards.service';

/**
 * Автозакрытие рейтинговой недели после субботы.
 * Вс 06:00 Europe/Moscow — если субботний турнир уже завершён
 * (основное закрытие срабатывает сразу после finish субботы).
 */
@Injectable()
export class RatingWeekCloseCron {
  private readonly logger = new Logger(RatingWeekCloseCron.name);

  constructor(private readonly ratingRewardsService: RatingRewardsService) {}

  @Cron('0 6 * * 0', { timeZone: 'Europe/Moscow' })
  async closeWeekAfterSaturday(): Promise<void> {
    try {
      const result = await this.ratingRewardsService.closeCurrentWeekIfNoLiveSaturday(
        'system-cron',
      );
      if (!result) {
        return;
      }
      this.logger.log(
        `Автозакрытие недели ${result.weekKey}: alreadyClosed=${result.alreadyClosed}, финалистов=${result.qualified.length}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Автозакрытие недели пропущено: ${message}`);
    }
  }
}
