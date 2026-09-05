import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminRole } from '../../../common/enums/admin-role.enum';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AdminJwtPayload } from '../../../common/interfaces/jwt-payload.interface';
import { AdminAuthGuard } from '../../auth/guards/admin-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto, CreateShiftEntryDto, UpdateShiftEntryDto } from './dto/analytics.dto';

@ApiTags('Admin / Analytics')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard, RolesGuard)
@Roles(AdminRole.OWNER, AdminRole.ADMIN, AdminRole.MANAGER)
@Controller('admin/analytics')
export class AdminAnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /** Сводка за месяц: смены + ре-энтри/аддоны. */
  @Get('summary')
  getSummary(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getSummary(query);
  }

  /** Смены за месяц: записи, общий итог, разбивка по сотрудникам. */
  @Get('shifts')
  getShifts(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getShifts(query);
  }

  @Post('shifts')
  createShift(@CurrentUser() admin: AdminJwtPayload, @Body() dto: CreateShiftEntryDto) {
    return this.analyticsService.createShift(dto, admin.sub);
  }

  @Patch('shifts/:id')
  updateShift(@Param('id') id: string, @Body() dto: UpdateShiftEntryDto) {
    return this.analyticsService.updateShift(id, dto);
  }

  @Delete('shifts/:id')
  deleteShift(@Param('id') id: string) {
    return this.analyticsService.deleteShift(id);
  }

  /** Ре-энтри/аддоны за месяц либо по турниру (?tournamentId=). */
  @Get('re-entries')
  getReEntries(@Query() query: AnalyticsQueryDto & { tournamentId?: string }) {
    return this.analyticsService.getReEntries(query);
  }
}
