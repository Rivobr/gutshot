import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminRole } from '../../common/enums/admin-role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminJwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { RatingService } from './rating.service';
import { RatingRewardsService } from './rating-rewards.service';

class CloseWeekDto {
  @IsOptional()
  @IsString()
  weekKey?: string;

  @IsOptional()
  @IsIn(['previous', 'current'])
  target?: 'previous' | 'current';

  @IsOptional()
  @IsBoolean()
  force?: boolean;
}

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
  getWeekly(@Query('week') week?: string) {
    const mode = week === 'previous' || week === 'current' || week === 'auto' ? week : 'auto';
    return this.ratingService.getWeeklyRating(mode);
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

/** Закрытие недели (топ-7 → финал) и выплата XP-наград. */
@ApiTags('Admin / Rating rewards')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard, RolesGuard)
@Roles(AdminRole.OWNER, AdminRole.ADMIN)
@Controller('admin/rating-rewards')
export class AdminRatingRewardsController {
  constructor(private readonly ratingRewardsService: RatingRewardsService) {}

  @Roles(AdminRole.OWNER, AdminRole.ADMIN)
  @Post('close-week')
  closeWeek(@Body() body: CloseWeekDto, @CurrentUser() admin: AdminJwtPayload) {
    return this.ratingRewardsService.closeWeek(
      { weekKey: body?.weekKey, target: body?.target, force: body?.force },
      admin.sub,
    );
  }

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
