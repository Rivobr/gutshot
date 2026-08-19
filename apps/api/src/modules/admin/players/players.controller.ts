import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminRole } from '../../../common/enums/admin-role.enum';
import { Roles } from '../../../common/decorators/roles.decorator';
import { AdminAuthGuard } from '../../auth/guards/admin-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { CreatePlayerDto } from './dto/create-player.dto';
import { AdminPlayersService } from './players.service';

@ApiTags('Admin / Players')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard, RolesGuard)
@Roles(AdminRole.OWNER, AdminRole.ADMIN)
@Controller('admin/players')
export class AdminPlayersController {
  constructor(private readonly playersService: AdminPlayersService) {}

  @Get()
  findAll() {
    return this.playersService.findAll();
  }

  /** Создать (или вернуть) игрока по Telegram ID / @username — до первого входа в Mini App. */
  @Post()
  create(@Body() dto: CreatePlayerDto) {
    const query = (dto.query ?? dto.telegramId ?? '').trim();
    return this.playersService.createByQuery(query, dto.isVerified ?? false);
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
