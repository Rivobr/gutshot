import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { TournamentsService } from '../tournaments/tournaments.service';
import { RatingService } from '../rating/rating.service';

/**
 * Публичные данные для лендинга сайта (без входа):
 * ближайший турнир, сетка недели, витрина рейтинга.
 */
@ApiTags('Public')
@Controller('public')
export class PublicController {
  constructor(
    private readonly tournamentsService: TournamentsService,
    private readonly ratingService: RatingService,
  ) {}

  @Public()
  @Get('landing')
  async landing() {
    const nearest = await this.tournamentsService.findNearest();

    return {
      nearestTournament: nearest,
      schedule: [
        { day: 'СР', time: '19:00', kind: 'РЕЙТИНГ' },
        { day: 'ПТ', time: '19:00', kind: 'ФРИРОЛЛ' },
        { day: 'СБ', time: '17:00', kind: 'РЕЙТИНГ' },
      ],
      club: {
        name: 'GUTSHOT Poker Club',
        address: 'Санкт-Петербург, Миллионная ул., 19',
        phone: '+7 999 009-11-99',
        legalName: 'ИП Миронов Михаил Александрович',
        inn: '781140907760',
        support: '@gutshot_suport',
      },
    };
  }

  @Public()
  @Get('ratings/weekly')
  async weeklyRating(@Query('mode') mode?: 'current' | 'previous') {
    const rating = await this.ratingService.getWeeklyRating(
      mode === 'previous' ? 'previous' : 'current',
    );
    return {
      weekKey: rating.weekKey,
      start: rating.start,
      end: rating.end,
      period: rating.period,
      entries: rating.entries.slice(0, 20),
    };
  }

  @Public()
  @Get('ratings/final')
  async finalRating() {
    const entries = await this.ratingService.getMonthlyFinalRating();
    return { entries: entries.slice(0, 20) };
  }
}
