import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';
import { ProfileService } from './profile.service';
import { UsersService } from '../users.service';
import { QueryEventsDto } from './dto/query-events.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePinnedAchievementsDto } from './dto/update-pinned-achievements.dto';

@ApiTags('Profile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly usersService: UsersService,
  ) {}

  /** Лёгкий вход Mini App: без метрик и достижений. */
  @Get('bootstrap')
  getBootstrap(@CurrentUser() user: JwtPayload) {
    return this.profileService.getBootstrap(user.sub);
  }

  @Get()
  getProfile(@CurrentUser() user: JwtPayload) {
    return this.profileService.getProfile(user.sub);
  }

  @Patch()
  async updateProfile(@CurrentUser() user: JwtPayload, @Body() dto: UpdateProfileDto) {
    await this.usersService.updateNickname(user.sub, dto.nickname);
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

  /** Витрина достижений: до 3 закреплённых, видны другим игрокам. */
  @Put('achievements/pinned')
  setPinnedAchievements(@CurrentUser() user: JwtPayload, @Body() dto: UpdatePinnedAchievementsDto) {
    return this.profileService.setPinnedAchievements(user.sub, dto.achievementIds);
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
    return {
      consentAcceptedAt: updated.consentAcceptedAt ? updated.consentAcceptedAt.toISOString() : null,
    };
  }
}
