import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TournamentsService } from './tournaments.service';
import { QueryTournamentsDto } from './dto/query-tournaments.dto';

@ApiTags('Tournaments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tournaments')
export class TournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  @Get()
  findAll(@Query() query: QueryTournamentsDto) {
    return this.tournamentsService.findAll(query);
  }

  @Get('nearest')
  findNearest() {
    return this.tournamentsService.findNearest();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tournamentsService.findById(id);
  }

  @Get(':id/participants')
  getParticipants(@Param('id') id: string) {
    return this.tournamentsService.getParticipants(id);
  }
}
