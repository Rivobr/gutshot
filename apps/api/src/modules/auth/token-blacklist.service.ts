import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../../redis/redis.service';

const BLACKLIST_PREFIX = 'auth:blacklist:';

@Injectable()
export class TokenBlacklistService {
  constructor(
    private readonly redis: RedisService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Помещает токен в blacklist на оставшееся до его истечения время.
   * Если токен уже истек — ничего не делает.
   */
  async revoke(token: string): Promise<void> {
    const decoded = this.jwtService.decode(token) as { exp?: number } | null;

    if (!decoded?.exp) {
      // Нет срока действия — храним фиксированные 24 часа.
      await this.redis.set(this.key(token), '1', 'EX', 60 * 60 * 24);
      return;
    }

    const ttlSeconds = decoded.exp - Math.floor(Date.now() / 1000);

    if (ttlSeconds <= 0) {
      return;
    }

    await this.redis.set(this.key(token), '1', 'EX', ttlSeconds);
  }

  async isRevoked(token: string): Promise<boolean> {
    const value = await this.redis.get(this.key(token));
    return value !== null;
  }

  private key(token: string): string {
    return `${BLACKLIST_PREFIX}${token}`;
  }
}
