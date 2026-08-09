import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { RatingRewardsService } from './rating-rewards.service';

/**
 * Автозакрытие рейтинговой недели после воскресенья.
 * Пн 00:15 Europe/Moscow → закрываем предыдущую неделю (топ-7 в финал месяца).
 */
@Injectable()
export class RatingWeekCloseCron {
  private readonly logger = new Logger(RatingWeekCloseCron.name);

  constructor(private readonly ratingRewardsService: RatingRewardsService) {}

  @Cron('15 0 * * 1', { timeZone: 'Europe/Moscow' })
  async closePreviousWeekAfterSunday(): Promise<void> {
    try {
      const result = await this.ratingRewardsService.closeWeek(
        { target: 'previous' },
        'system-cron',
      );
      this.logger.log(
        `Автозакрытие недели ${result.weekKey}: alreadyClosed=${result.alreadyClosed}, финалистов=${result.qualified.length}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      // Пустая неделя / ещё идёт — не ошибка деплоя, просто лог.
      this.logger.warn(`Автозакрытие недели пропущено: ${message}`);
    }
  }
}
