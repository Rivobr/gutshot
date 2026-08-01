import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseArrayPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminAuthGuard } from '../../auth/guards/admin-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AdminRole } from '../../../common/enums/admin-role.enum';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AdminJwtPayload } from '../../../common/interfaces/jwt-payload.interface';
import { AdminTournamentsService } from './admin-tournaments.service';
import { AttendanceService } from '../attendance/attendance.service';
import { MarkAttendanceDto } from '../scanner/dto/scanner.dto';
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
    private readonly attendanceService: AttendanceService,
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

  @Roles(AdminRole.OWNER, AdminRole.ADMIN)
  @HttpCode(204)
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
  @Post(':id/archive')
  archive(@Param('id') id: string) {
    return this.adminTournamentsService.archive(id);
  }

  @Roles(AdminRole.OWNER, AdminRole.ADMIN)
  @Post(':id/finish')
  finish(
    @CurrentUser() admin: AdminJwtPayload,
    @Param('id') id: string,
    @Body(new ParseArrayPipe({ items: TournamentResultEntryDto }))
    results: TournamentResultEntryDto[],
  ) {
    return this.adminTournamentsService.finish(id, results, admin.sub);
  }

  @Get(':id/registrations')
  getRegistrations(@Param('id') id: string) {
    return this.adminTournamentsService.getRegistrations(id);
  }

  /** Отметка явки игрока на турнир. XP за посещение начисляется однократно. */
  @Post(':id/registrations/:registrationId/attendance')
  markAttendance(
    @CurrentUser() admin: AdminJwtPayload,
    @Param('registrationId') registrationId: string,
    @Body() dto: MarkAttendanceDto,
  ) {
    return this.attendanceService.markAttendance(registrationId, dto.arrived, admin.sub);
  }
}
