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
  Put,
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
import { UpdateTournamentDto, UpdateTournamentLiveDto } from './dto/update-tournament.dto';
import { TournamentResultEntryDto } from './dto/finish-tournament.dto';
import { SetPlaceDto } from './dto/set-place.dto';
import { AddPlayerByTelegramDto } from './dto/add-player-by-telegram.dto';
import {
  ApplyBlindStructureTemplateDto,
  ClockActionDto,
  UpdateBlindStructureDto,
} from './dto/blind-structure.dto';

@ApiTags('Admin / Tournaments')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard, RolesGuard)
@Roles(AdminRole.OWNER, AdminRole.ADMIN)
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
  @Patch(':id/live')
  updateLive(@Param('id') id: string, @Body() dto: UpdateTournamentLiveDto) {
    return this.adminTournamentsService.updateLive(id, dto);
  }

  @Get(':id/clock')
  getClock(@Param('id') id: string) {
    return this.adminTournamentsService.getClock(id);
  }

  @Roles(AdminRole.OWNER, AdminRole.ADMIN)
  @Put(':id/blind-structure')
  updateBlindStructure(@Param('id') id: string, @Body() dto: UpdateBlindStructureDto) {
    return this.adminTournamentsService.updateBlindStructure(id, dto);
  }

  @Roles(AdminRole.OWNER, AdminRole.ADMIN)
  @Post(':id/blind-structure/default')
  applyDefaultStructure(@Param('id') id: string, @Body() dto: ApplyBlindStructureTemplateDto = {}) {
    return this.adminTournamentsService.applyDefaultStructure(id, dto.template ?? 'classic20');
  }

  @Roles(AdminRole.OWNER, AdminRole.ADMIN)
  @Post(':id/clock/start')
  startClock(@Param('id') id: string, @Body() dto: ClockActionDto) {
    return this.adminTournamentsService.startClock(id, dto);
  }

  @Roles(AdminRole.OWNER, AdminRole.ADMIN)
  @Post(':id/clock/pause')
  pauseClock(@Param('id') id: string) {
    return this.adminTournamentsService.pauseClock(id);
  }

  @Roles(AdminRole.OWNER, AdminRole.ADMIN)
  @Post(':id/clock/resume')
  resumeClock(@Param('id') id: string) {
    return this.adminTournamentsService.resumeClock(id);
  }

  @Roles(AdminRole.OWNER, AdminRole.ADMIN)
  @Post(':id/clock/level/:levelIdx')
  setClockLevel(@Param('id') id: string, @Param('levelIdx') levelIdx: string) {
    return this.adminTournamentsService.setClockLevel(id, Number(levelIdx));
  }

  @Roles(AdminRole.OWNER, AdminRole.ADMIN)
  @Post(':id/clock/stop')
  stopClock(@Param('id') id: string) {
    return this.adminTournamentsService.stopClock(id);
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

  /** Добавить игрока в турнир по Telegram ID (find-or-create). */
  @Roles(AdminRole.OWNER, AdminRole.ADMIN)
  @Post(':id/registrations')
  addPlayerByTelegram(@Param('id') id: string, @Body() dto: AddPlayerByTelegramDto) {
    return this.adminTournamentsService.addPlayerByTelegramId(id, dto.telegramId);
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

  /**
   * Проставить / сбросить место во время турнира (до finish).
   * XP не начисляется — только запись места.
   */
  @Roles(AdminRole.OWNER, AdminRole.ADMIN)
  @Patch(':id/registrations/:registrationId/place')
  setPlace(
    @Param('id') id: string,
    @Param('registrationId') registrationId: string,
    @Body() dto: SetPlaceDto,
  ) {
    return this.adminTournamentsService.setPlace(id, registrationId, dto.place ?? null);
  }

  /** Игрок выбыл — автоматически следующее место с конца. */
  @Roles(AdminRole.OWNER, AdminRole.ADMIN)
  @Post(':id/registrations/:registrationId/eliminate')
  eliminate(@Param('id') id: string, @Param('registrationId') registrationId: string) {
    return this.adminTournamentsService.eliminate(id, registrationId);
  }
}
