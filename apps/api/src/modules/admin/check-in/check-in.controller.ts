import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminAuthGuard } from '../../auth/guards/admin-auth.guard';
import { CheckInService } from './check-in.service';
import { CheckInDto } from './dto/check-in.dto';

@ApiTags('Admin / Check-In')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@Controller('admin/check-in')
export class CheckInController {
  constructor(private readonly checkInService: CheckInService) {}

  @Post()
  checkIn(@Body() dto: CheckInDto) {
    return this.checkInService.checkIn(dto.token);
  }
}
