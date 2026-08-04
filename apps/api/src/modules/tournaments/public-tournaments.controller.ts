import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { TournamentsService } from './tournaments.service';

/**
 * Открытые эндпоинты для TV-табло в зале: без авторизации и без личных данных.
 */
@ApiTags('Public / Tournaments')
@Public()
@Controller('public/tournaments')
export class PublicTournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  /** Расписание для афиши. */
  @Get()
  findAll() {
    return this.tournamentsService.findPublicSchedule();
  }

  /** Турнир для табло: идущий сейчас, иначе ближайший. */
  @Get('board')
  board() {
    return this.tournamentsService.findBoard();
  }

  @Get(':id/board')
  boardById(@Param('id') id: string) {
    return this.tournamentsService.findBoardById(id);
  }
}
