import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminAuthGuard } from '../../auth/guards/admin-auth.guard';
import { StatisticsService } from './statistics.service';

@ApiTags('Admin / Statistics')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@Controller('admin/statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get()
  getStatistics() {
    return this.statisticsService.getStatistics();
  }
}
