import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminAuthGuard } from '../../auth/guards/admin-auth.guard';
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
}
