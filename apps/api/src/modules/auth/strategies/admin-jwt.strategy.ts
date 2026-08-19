import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { AdminJwtPayload } from '../../../common/interfaces/jwt-payload.interface';
import { PrismaService } from '../../../prisma/prisma.service';
import { TokenBlacklistService } from '../token-blacklist.service';

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor(
    configService: ConfigService,
    private readonly tokenBlacklistService: TokenBlacklistService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.adminSecret') ?? '',
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: AdminJwtPayload): Promise<AdminJwtPayload> {
    if (!payload?.sub) {
      throw new UnauthorizedException('Недействительный токен администратора');
    }

    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);

    if (token && (await this.tokenBlacklistService.isRevoked(token))) {
      throw new UnauthorizedException('Токен отозван');
    }

    const admin = await this.prisma.adminUser.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true },
    });

    if (!admin) {
      throw new UnauthorizedException('Администратор не найден');
    }

    return {
      ...payload,
      email: admin.email,
      role: admin.role,
    };
  }
}
