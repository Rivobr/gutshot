import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminAuthGuard } from '../../auth/guards/admin-auth.guard';
import { PlayerEventsService } from '../../progression/player-events.service';
import { QueryHistoryDto } from './dto/query-history.dto';

@ApiTags('Admin / History')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@Controller('admin/history')
export class AdminHistoryController {
  constructor(private readonly playerEventsService: PlayerEventsService) {}

  /** История событий с фильтрами по игроку, турниру и типу события. */
  @Get()
  async findAll(@Query() query: QueryHistoryDto) {
    const [items, total] = await Promise.all([
      this.playerEventsService.findMany({
        userId: query.userId,
        tournamentId: query.tournamentId,
        type: query.type,
        take: query.take,
        skip: query.skip,
      }),
      this.playerEventsService.countFor({
        userId: query.userId,
        tournamentId: query.tournamentId,
        type: query.type,
      }),
    ]);

    return { items, total };
  }
}
