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
import { BroadcastSegment } from '@prisma/client';
import { AdminRole } from '../../../common/enums/admin-role.enum';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AdminAuthGuard } from '../../auth/guards/admin-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { AdminBroadcastService } from './broadcast.service';
import {
  CreateBroadcastDto,
  TestBroadcastDto,
  UpdateBroadcastDto,
} from './dto/broadcast.dto';

@ApiTags('Admin / Broadcasts')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard, RolesGuard)
@Roles(AdminRole.OWNER, AdminRole.ADMIN, AdminRole.MANAGER)
@Controller('admin/broadcasts')
export class AdminBroadcastController {
  constructor(private readonly broadcastService: AdminBroadcastService) {}

  @Get()
  list() {
    return this.broadcastService.list();
  }

  @Get('preview')
  preview(
    @Query('segment') segment: BroadcastSegment,
    @Query('tournamentId') tournamentId?: string,
    @Query('targetUserId') targetUserId?: string,
  ) {
    return this.broadcastService.previewSegment(segment, tournamentId, targetUserId);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.broadcastService.getById(id);
  }

  @Post()
  create(@Body() dto: CreateBroadcastDto) {
    return this.broadcastService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBroadcastDto) {
    return this.broadcastService.update(id, dto);
  }

  @Post(':id/test')
  test(@Param('id') id: string, @Body() dto: TestBroadcastDto) {
    return this.broadcastService.sendTest(id, dto.telegramId);
  }

  @Post(':id/send')
  send(@Param('id') id: string) {
    return this.broadcastService.send(id);
  }

  /** Удалить отправленные Telegram-сообщения по сохранённым message_id. */
  @Post(':id/delete-messages')
  deleteMessages(@Param('id') id: string) {
    return this.broadcastService.deleteMessages(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.broadcastService.deleteDraft(id);
  }
}
