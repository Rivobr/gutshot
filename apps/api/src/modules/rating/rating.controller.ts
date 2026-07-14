import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RatingService } from './rating.service';

@ApiTags('Ratings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ratings')
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  @Get()
  getOverall() {
    return this.ratingService.getOverallRating();
  }

  @Get('weekly')
  getWeekly() {
    return this.ratingService.getWeeklyRating();
  }
}
