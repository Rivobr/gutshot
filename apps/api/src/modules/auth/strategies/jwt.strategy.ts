import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';
import { PrismaService } from '../../../prisma/prisma.service';
import { TokenBlacklistService } from '../token-blacklist.service';

/** Блокировку проверяем не чаще раза в минуту на пользователя — вход не должен тормозить. */
const BLOCK_CHECK_TTL_MS = 60_000;

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly blockCache = new Map<string, { blocked: boolean; checkedAt: number }>();

  constructor(
    configService: ConfigService,
    private readonly tokenBlacklistService: TokenBlacklistService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret') ?? '',
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload): Promise<JwtPayload> {
    if (!payload?.sub) {
      throw new UnauthorizedException('Недействительный токен');
    }

    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);

    if (token && (await this.tokenBlacklistService.isRevoked(token))) {
      throw new UnauthorizedException('Токен отозван');
    }

    // Блокировка должна действовать сразу, а не после истечения JWT (7 дней).
    if (await this.isBlocked(payload.sub)) {
      throw new ForbiddenException('Аккаунт заблокирован. Обратитесь к администратору клуба.');
    }

    return payload;
  }

  private async isBlocked(userId: string): Promise<boolean> {
    const cached = this.blockCache.get(userId);
    if (cached && Date.now() - cached.checkedAt < BLOCK_CHECK_TTL_MS) {
      return cached.blocked;
    }

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { isBlocked: true },
      });
      const blocked = user?.isBlocked ?? false;
      this.blockCache.set(userId, { blocked, checkedAt: Date.now() });
      return blocked;
    } catch {
      // БД недоступна — не выкидываем игроков из клуба.
      return cached?.blocked ?? false;
    }
  }
}
