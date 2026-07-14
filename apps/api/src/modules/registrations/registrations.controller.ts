import { Body, Controller, Delete, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { RegistrationsService } from './registrations.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';

@ApiTags('Registrations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('registrations')
export class RegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @Post()
  register(@CurrentUser() user: JwtPayload, @Body() dto: CreateRegistrationDto) {
    return this.registrationsService.register(user.sub, dto.tournamentId);
  }

  @HttpCode(204)
  @Delete(':id')
  cancel(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.registrationsService.cancel(user.sub, id);
  }

  @Get('current')
  getCurrent(@CurrentUser() user: JwtPayload) {
    return this.registrationsService.getCurrent(user.sub);
  }

  @Get('current/qr')
  getCurrentQr(@CurrentUser() user: JwtPayload) {
    return this.registrationsService.getCurrentQr(user.sub);
  }
}
