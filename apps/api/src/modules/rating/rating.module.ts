import { Module } from '@nestjs/common';
import { ProgressionModule } from '../progression/progression.module';
import { TelegramModule } from '../telegram/telegram.module';
import { RatingService } from './rating.service';
import { RatingRewardsService } from './rating-rewards.service';
import { RatingWeekCloseCron } from './rating-week-close.cron';
import { RatingController, AdminRatingRewardsController } from './rating.controller';

@Module({
  imports: [ProgressionModule, TelegramModule],
  controllers: [RatingController, AdminRatingRewardsController],
  providers: [RatingService, RatingRewardsService, RatingWeekCloseCron],
  exports: [RatingService, RatingRewardsService],
})
export class RatingModule {}
