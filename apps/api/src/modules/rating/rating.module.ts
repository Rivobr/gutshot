import { Module } from '@nestjs/common';
import { ProgressionModule } from '../progression/progression.module';
import { RatingService } from './rating.service';
import { RatingController } from './rating.controller';

@Module({
  imports: [ProgressionModule],
  controllers: [RatingController],
  providers: [RatingService],
  exports: [RatingService],
})
export class RatingModule {}
