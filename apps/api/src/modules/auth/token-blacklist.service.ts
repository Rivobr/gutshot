import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../../redis/redis.service';

const BLACKLIST_PREFIX = 'auth:blacklist:';

@Injectable()
export class TokenBlacklistService {
  private readonly logger = new Logger(TokenBlacklistService.name);

  constructor(
    private readonly redis: RedisService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Помещает токен в blacklist на оставшееся до его истечения время.
   * Если токен уже истек — ничего не делает.
   */
  async revoke(token: string): Promise<void> {
    try {
      const decoded = this.jwtService.decode(token) as { exp?: number } | null;

      if (!decoded?.exp) {
        await this.redis.set(this.key(token), '1', 'EX', 60 * 60 * 24);
        return;
      }

      const ttlSeconds = decoded.exp - Math.floor(Date.now() / 1000);

      if (ttlSeconds <= 0) {
        return;
      }

      await this.redis.set(this.key(token), '1', 'EX', ttlSeconds);
    } catch (error) {
      this.logger.warn(
        `Не удалось отозвать токен в Redis: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Fail-open: если Redis лежит/тормозит — считаем токен валидным.
   * Иначе каждый /profile зависает и Mini App показывает вечную загрузку.
   */
  async isRevoked(token: string): Promise<boolean> {
    try {
      const value = await this.redis.get(this.key(token));
      return value !== null;
    } catch (error) {
      this.logger.warn(
        `Redis blacklist check failed (fail-open): ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return false;
    }
  }

  private key(token: string): string {
    return `${BLACKLIST_PREFIX}${token}`;
  }
}
