import { Module } from '@nestjs/common';
import { TournamentsModule } from '../tournaments/tournaments.module';
import { RatingModule } from '../rating/rating.module';
import { PublicController } from './public.controller';

@Module({
  imports: [TournamentsModule, RatingModule],
  controllers: [PublicController],
})
export class PublicModule {}
