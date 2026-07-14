import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

/**
 * Проверяет наличие Telegram initData во входящем запросе.
 * Валидация подписи и создание/поиск пользователя выполняется
 * в AuthService (Stage 4 — Authentication).
 */
@Injectable()
export class TelegramAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const initData = (request.body as { initData?: string } | undefined)?.initData;

    if (!initData) {
      throw new UnauthorizedException('Отсутствуют данные авторизации Telegram');
    }

    return true;
  }
}
