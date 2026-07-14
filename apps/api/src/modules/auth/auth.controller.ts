import { Body, Controller, Headers, HttpCode, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { TelegramLoginDto } from './dto/telegram-login.dto';
import { AdminLoginDto } from './dto/admin-login.dto';
import { TokenBlacklistService } from './token-blacklist.service';

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
}
