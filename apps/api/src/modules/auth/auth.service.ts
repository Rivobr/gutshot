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

    if (user.isBlocked) {
      throw new UnauthorizedException('Пользователь заблокирован');
    }

    const payload: JwtPayload = { sub: user.id, telegramId: user.telegramId };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        telegramId: user.telegramId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        photoUrl: user.photoUrl,
      },
    };
  }

  async loginAdmin(email: string, password: string) {
    const admin = await this.prisma.adminUser.findUnique({ where: { email } });

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
