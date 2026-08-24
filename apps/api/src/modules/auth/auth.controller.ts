import { Body, Controller, Headers, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthService } from './auth.service';
import { TelegramLoginDto } from './dto/telegram-login.dto';
import { TelegramTicketLoginDto } from './dto/telegram-ticket-login.dto';
import { AdminLoginDto } from './dto/admin-login.dto';
import { WebRegisterDto } from './dto/web-register.dto';
import { WebLoginDto } from './dto/web-login.dto';
import { PhoneRequestCodeDto, PhoneVerifyDto } from './dto/phone-code.dto';
import { ChangePasswordDto, ForgotPasswordDto, ResetPasswordDto } from './dto/password.dto';
import { TelegramWidgetDto } from './dto/telegram-widget.dto';
import { TokenBlacklistService } from './token-blacklist.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenBlacklistService: TokenBlacklistService,
  ) {}

  @Public()
  @Post('telegram')
  loginWithTelegram(@Body() dto: TelegramLoginDto) {
    return this.authService.loginWithTelegram(dto.initData);
  }

  @Public()
  @Post('telegram/ticket')
  loginWithTicket(@Body() dto: TelegramTicketLoginDto) {
    return this.authService.loginWithTicket(dto.ticket);
  }

  @Public()
  @Post('admin/login')
  loginAdmin(@Body() dto: AdminLoginDto) {
    return this.authService.loginAdmin(dto.email, dto.password);
  }

  @Public()
  @HttpCode(204)
  @Post('logout')
  async logout(@Headers('authorization') authorization?: string): Promise<void> {
    const token = authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length).trim()
      : undefined;

    if (token) {
      await this.tokenBlacklistService.revoke(token);
    }
  }

  // ── Web auth (сайт клуба) ─────────────────────────────────

  @Public()
  @Post('register')
  registerWeb(@Body() dto: WebRegisterDto) {
    return this.authService.registerWeb({
      nickname: dto.nickname,
      email: dto.email,
      password: dto.password,
      consents: dto.consents,
    });
  }

  @Public()
  @Post('login')
  loginWithPassword(@Body() dto: WebLoginDto) {
    return this.authService.loginWithPassword(dto.login, dto.password);
  }

  @Public()
  @Post('phone/request-code')
  requestPhoneCode(@Body() dto: PhoneRequestCodeDto) {
    return this.authService.requestPhoneCode(dto.phone);
  }

  @Public()
  @Post('phone/verify')
  verifyPhoneCode(@Body() dto: PhoneVerifyDto) {
    return this.authService.verifyPhoneCode(dto.phone, dto.code);
  }

  @Public()
  @Post('telegram/widget')
  loginWithTelegramWidget(@Body() dto: TelegramWidgetDto) {
    // Виджет присылает id и auth_date числами — подпись считается по строкам.
    const fields: Record<string, string> = {
      id: String(dto.id),
      auth_date: String(dto.auth_date),
      hash: dto.hash,
    };
    if (dto.first_name) fields.first_name = dto.first_name;
    if (dto.last_name) fields.last_name = dto.last_name;
    if (dto.username) fields.username = dto.username;
    if (dto.photo_url) fields.photo_url = dto.photo_url;

    return this.authService.loginWithTelegramWidget(fields);
  }

  @Public()
  @Post('forgot')
  @HttpCode(200)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Public()
  @Post('reset')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('password/change')
  changePassword(@CurrentUser() user: JwtPayload, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(user.sub, dto.currentPassword, dto.newPassword);
  }

  /** Код для команды /link <код> в боте — привязка Telegram к аккаунту. */
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('telegram/link-code')
  createTelegramLinkCode(@CurrentUser() user: JwtPayload) {
    return { code: this.authService.createTelegramLinkCode(user.sub) };
  }
}
