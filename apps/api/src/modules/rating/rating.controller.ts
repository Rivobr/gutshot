import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminRole } from '../../common/enums/admin-role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminJwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { RatingService } from './rating.service';
import { RatingRewardsService } from './rating-rewards.service';

class CloseMonthDto {
  @IsOptional()
  @IsString()
  monthKey?: string;

  @IsOptional()
  @IsBoolean()
  rebuild?: boolean;
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

  @Get('xp')
  getXp() {
    return this.ratingService.getOverallRating();
  }

  @Get('monthly')
  getMonthly(@Query('month') month?: string) {
    const mode = month === 'previous' ? 'previous' : 'current';
    return this.ratingService.getMonthlyRating(mode);
  }

  @Get('final')
  getFinal(@Query('month') month?: string) {
    return this.ratingService.getMonthFinalists(month || undefined);
  }

  @Get('scale')
  getScale() {
    return this.ratingService.getPlaceScale();
  }
}

/** Закрытие месяца (топ-27 → финал) и выплата XP-наград. */
@ApiTags('Admin / Rating rewards')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard, RolesGuard)
@Roles(AdminRole.OWNER, AdminRole.ADMIN)
@Controller('admin/rating-rewards')
export class AdminRatingRewardsController {
  constructor(private readonly ratingRewardsService: RatingRewardsService) {}

  @Roles(AdminRole.OWNER, AdminRole.ADMIN)
  @Post('close-month')
  closeMonth(@Body() body: CloseMonthDto, @CurrentUser() admin: AdminJwtPayload) {
    return this.ratingRewardsService.closeMonth(
      { monthKey: body?.monthKey, rebuild: body?.rebuild },
      admin.sub,
    );
  }

  @Roles(AdminRole.OWNER, AdminRole.ADMIN)
  @Post('monthly')
  payoutMonthly(@CurrentUser() admin: AdminJwtPayload) {
    return this.ratingRewardsService.payoutMonthly(admin.sub);
  }
}
