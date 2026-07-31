import { Controller, Get, HttpCode, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';
import { ProfileService } from './profile.service';
import { UsersService } from '../users.service';
import { QueryEventsDto } from './dto/query-events.dto';

@ApiTags('Profile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  getProfile(@CurrentUser() user: JwtPayload) {
    return this.profileService.getProfile(user.sub);
  }

  /** Постоянный персональный QR-код игрока. */
  @Get('qr')
  getQrCode(@CurrentUser() user: JwtPayload) {
    return this.profileService.getQrCode(user.sub);
  }

  @Get('history')
  getHistory(@CurrentUser() user: JwtPayload) {
    return this.profileService.getXpHistory(user.sub);
  }

  /** История активности: явка, вылеты, ре-энтри, баунти, комбинации, уровни. */
  @Get('events')
  getEvents(@CurrentUser() user: JwtPayload, @Query() query: QueryEventsDto) {
    return this.profileService.getEvents(user.sub, query.take, query.skip);
  }

  @Get('achievements')
  getAchievements(@CurrentUser() user: JwtPayload) {
    return this.profileService.getAchievements(user.sub);
  }

  @Get('tournaments')
  getTournaments(@CurrentUser() user: JwtPayload) {
    return this.profileService.getTournamentHistory(user.sub);
  }

  /** Принятие пользовательских соглашений при первом входе. */
  @HttpCode(200)
  @Post('consent')
  async acceptConsent(@CurrentUser() user: JwtPayload) {
    const updated = await this.usersService.acceptConsent(user.sub);
    return { consentAcceptedAt: updated.consentAcceptedAt };
  }
}
