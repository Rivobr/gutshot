import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { AdminRole } from '../../../common/enums/admin-role.enum';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AdminAuthGuard } from '../../auth/guards/admin-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AdminJwtPayload } from '../../../common/interfaces/jwt-payload.interface';
import { AdminBroadcastService } from './broadcast.service';
import { CreateBroadcastDto, UpdateBroadcastDto } from './dto/broadcast.dto';

interface UploadedPhoto {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

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
    @Query('segment') segment: 'ALL_ACTIVE' | 'SINGLE_PLAYER',
    @Query('targetTelegramId') targetTelegramId?: string,
  ) {
    return this.broadcastService.preview(segment, targetTelegramId);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.broadcastService.getById(id);
  }

  /** Загрузка фото для рассылки (multipart, поле photo). */
  @Post('photo')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  uploadPhoto(@UploadedFile() file?: UploadedPhoto) {
    return this.broadcastService.savePhoto(file);
  }

  @Post()
  create(@Body() dto: CreateBroadcastDto, @CurrentUser() admin?: AdminJwtPayload) {
    return this.broadcastService.create(dto, admin?.sub);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBroadcastDto) {
    return this.broadcastService.update(id, dto);
  }

  @Post(':id/send')
  send(@Param('id') id: string) {
    return this.broadcastService.send(id);
  }

  /** Удалить все отправленные Telegram-сообщения по сохранённым message_id. */
  @Post(':id/delete-messages')
  deleteMessages(@Param('id') id: string) {
    return this.broadcastService.deleteMessages(id);
  }

  /** Удалить одно сообщение в Telegram по message_id конкретной доставки. */
  @Delete(':id/messages/:deliveryId')
  deleteDeliveryMessage(@Param('id') id: string, @Param('deliveryId') deliveryId: string) {
    return this.broadcastService.deleteDeliveryMessage(id, deliveryId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.broadcastService.deleteDraft(id);
  }
}
