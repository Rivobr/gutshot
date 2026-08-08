import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminAuthGuard } from '../../auth/guards/admin-auth.guard';
import { CreatePlayerDto } from './dto/create-player.dto';
import { AdminPlayersService } from './players.service';

@ApiTags('Admin / Players')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@Controller('admin/players')
export class AdminPlayersController {
  constructor(private readonly playersService: AdminPlayersService) {}

  @Get()
  findAll() {
    return this.playersService.findAll();
  }

  /** Создать (или вернуть) игрока по Telegram ID — для регистрации до первого входа в Mini App. */
  @Post()
  create(@Body() dto: CreatePlayerDto) {
    return this.playersService.createByTelegramId(dto.telegramId, dto.isVerified ?? false);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.playersService.findById(id);
  }

  @Patch(':id/block')
  block(@Param('id') id: string) {
    return this.playersService.block(id);
  }

  @Patch(':id/unblock')
  unblock(@Param('id') id: string) {
    return this.playersService.unblock(id);
  }

  @Patch(':id/verify')
  verify(@Param('id') id: string) {
    return this.playersService.setVerified(id, true);
  }

  @Patch(':id/unverify')
  unverify(@Param('id') id: string) {
    return this.playersService.setVerified(id, false);
  }

  /** Сброс принятия соглашений — приветственный экран покажется снова. */
  @Patch(':id/reset-consent')
  resetConsent(@Param('id') id: string) {
    return this.playersService.resetConsent(id);
  }
}
