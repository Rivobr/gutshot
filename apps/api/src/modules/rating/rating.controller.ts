import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminRole } from '../../common/enums/admin-role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminJwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { RatingService } from './rating.service';
import { RatingRewardsService } from './rating-rewards.service';

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

  @Get('final')
  getFinal() {
    return this.ratingService.getMonthlyFinalRating();
  }

  @Get('scale')
  getScale() {
    return this.ratingService.getPlaceScale();
  }
}

/** Выплата наград за неделю и финал месяца (ТЗ клуба). */
@ApiTags('Admin / Rating rewards')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard, RolesGuard)
@Roles(AdminRole.OWNER, AdminRole.ADMIN)
@Controller('admin/rating-rewards')
export class AdminRatingRewardsController {
  constructor(private readonly ratingRewardsService: RatingRewardsService) {}

  @Roles(AdminRole.OWNER, AdminRole.ADMIN)
  @Post('weekly')
  payoutWeekly(@CurrentUser() admin: AdminJwtPayload) {
    return this.ratingRewardsService.payoutWeekly(admin.sub);
  }

  @Roles(AdminRole.OWNER, AdminRole.ADMIN)
  @Post('monthly')
  payoutMonthly(@CurrentUser() admin: AdminJwtPayload) {
    return this.ratingRewardsService.payoutMonthly(admin.sub);
  }
}
