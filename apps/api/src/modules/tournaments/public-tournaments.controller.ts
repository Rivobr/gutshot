import { Controller, Get, Header, Param, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { renderBoardHtml } from './board-html';
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

  /**
   * HTML-табло без JavaScript (meta refresh).
   * Нужно для Xiaomi YaBrowser Lite — там скрипты не выполняются.
   */
  @Get('board.html')
  @Header('Cache-Control', 'no-cache, no-store, must-revalidate')
  async boardHtml(@Query('tournament') tournamentId: string | undefined, @Res() res: Response) {
    const data = tournamentId
      ? await this.tournamentsService.findBoardById(tournamentId)
      : await this.tournamentsService.findBoard();
    res
      .status(200)
      .type('html')
      .send(renderBoardHtml(data, { tournamentId: tournamentId || undefined }));
  }

  @Get(':id/board')
  boardById(@Param('id') id: string) {
    return this.tournamentsService.findBoardById(id);
  }
}
