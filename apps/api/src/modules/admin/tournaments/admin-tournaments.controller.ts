import { Body, Controller, Delete, Get, Param, ParseArrayPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminAuthGuard } from '../../auth/guards/admin-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AdminRole } from '../../../common/enums/admin-role.enum';
import { AdminTournamentsService } from './admin-tournaments.service';
import { RegistrationsService } from '../../registrations/registrations.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { TournamentResultEntryDto } from './dto/finish-tournament.dto';

@ApiTags('Admin / Tournaments')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard, RolesGuard)
@Controller('admin/tournaments')
export class AdminTournamentsController {
  constructor(
    private readonly adminTournamentsService: AdminTournamentsService,
    private readonly registrationsService: RegistrationsService,
  ) {}

  @Get()
  findAll() {
    return this.adminTournamentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.adminTournamentsService.findById(id);
  }

  @Roles(AdminRole.OWNER, AdminRole.ADMIN)
  @Post()
  create(@Body() dto: CreateTournamentDto) {
    return this.adminTournamentsService.create(dto);
  }

  @Roles(AdminRole.OWNER, AdminRole.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTournamentDto) {
    return this.adminTournamentsService.update(id, dto);
  }

  @Roles(AdminRole.OWNER)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.adminTournamentsService.remove(id);
  }

  @Roles(AdminRole.OWNER, AdminRole.ADMIN)
  @Post(':id/open')
  open(@Param('id') id: string) {
    return this.adminTournamentsService.openRegistration(id);
  }

  @Roles(AdminRole.OWNER, AdminRole.ADMIN)
  @Post(':id/close')
  close(@Param('id') id: string) {
    return this.adminTournamentsService.closeRegistration(id);
  }

  @Roles(AdminRole.OWNER, AdminRole.ADMIN)
  @Post(':id/start')
  start(@Param('id') id: string) {
    return this.adminTournamentsService.start(id);
  }

  @Roles(AdminRole.OWNER, AdminRole.ADMIN)
  @Post(':id/finish')
  finish(
    @Param('id') id: string,
    @Body(new ParseArrayPipe({ items: TournamentResultEntryDto }))
    results: TournamentResultEntryDto[],
  ) {
    return this.adminTournamentsService.finish(id, results);
  }

  @Get(':id/registrations')
  getRegistrations(@Param('id') id: string) {
    return this.registrationsService.findByTournament(id);
  }
}
