import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { verifyTelegramInitData } from '../../common/utils/telegram-init-data.util';
import { AdminJwtPayload, JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async loginWithTelegram(initData: string) {
    const botToken = this.configService.get<string>('telegram.botToken');

    if (!botToken) {
      throw new UnauthorizedException('Telegram авторизация не настроена');
    }

    const parsed = verifyTelegramInitData(initData, botToken);

    if (!parsed) {
      throw new UnauthorizedException('Недействительная подпись Telegram');
    }

    const user = await this.usersService.findOrCreateFromTelegram(parsed.user);
    return this.issuePlayerToken(user);
  }

  /**
   * Ticket for WebViews where Telegram initData is missing (e.g. alternate HTTPS
   * front like Cloudflare quick tunnel). Issued by the bot when sending the open button.
   * Долгий TTL: старая кнопка в чате должна открывать приложение и через часы/дни.
   */
  createMiniAppTicket(telegramId: string): string {
    return this.jwtService.sign({ typ: 'miniapp_ticket', telegramId }, { expiresIn: '7d' });
  }

  async loginWithTicket(ticket: string) {
    let payload: { typ?: string; telegramId?: string };
    try {
      payload = this.jwtService.verify(ticket) as { typ?: string; telegramId?: string };
    } catch {
      throw new UnauthorizedException(
        'Ссылка входа устарела. Нажмите /start в боте и откройте новой кнопкой.',
      );
    }

    if (payload.typ !== 'miniapp_ticket' || !payload.telegramId) {
      throw new UnauthorizedException('Недействительный билет входа');
    }

    // Раньше ticket требовал уже существующего User — повторный/первый вход
    // с кнопки бота падал, пока initData не создавал профиль. Теперь создаём.
    const user = await this.usersService.findOrCreateByTelegramId(String(payload.telegramId));
    return this.issuePlayerToken(user);
  }

  private issuePlayerToken(user: {
    id: string;
    telegramId: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    nickname: string | null;
    photoUrl: string | null;
    isBlocked: boolean;
  }) {
    if (user.isBlocked) {
      throw new UnauthorizedException('Пользователь заблокирован');
    }

    const jwtPayload: JwtPayload = { sub: user.id, telegramId: user.telegramId };
    const accessToken = this.jwtService.sign(jwtPayload);

    return {
      accessToken,
      user: {
        id: user.id,
        telegramId: user.telegramId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        nickname: user.nickname,
        photoUrl: user.photoUrl,
      },
    };
  }

  async loginAdmin(email: string, password: string) {
    // Почту вводят с телефона, где часто включена автозаглавная буква,
    // поэтому ищем без учёта регистра и лишних пробелов.
    const admin = await this.prisma.adminUser.findFirst({
      where: { email: { equals: email.trim(), mode: 'insensitive' } },
    });

    if (!admin) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const passwordValid = await compare(password, admin.passwordHash);

    if (!passwordValid) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    await this.prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLogin: new Date() },
    });

    const payload: AdminJwtPayload = { sub: admin.id, email: admin.email, role: admin.role };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.adminSecret'),
      expiresIn: this.configService.get<string>('jwt.adminExpiresIn'),
    });

    return {
      accessToken,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    };
  }
}
