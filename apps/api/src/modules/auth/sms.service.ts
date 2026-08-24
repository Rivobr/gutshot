import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { maskPhone } from '../../common/utils/phone.util';

/**
 * Отправка SMS. Провайдер задаётся env SMS_PROVIDER:
 *  - `console` (по умолчанию) — код пишется в лог сервера (разработка/первые запуски);
 *  - `none` — отправка отключена.
 * Точка подключения реального шлюза (SMS.ru, Twilio и т.п.) — метод deliver().
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private readonly configService: ConfigService) {}

  get provider(): string {
    return this.configService.get<string>('sms.provider') ?? 'console';
  }

  async send(phone: string, text: string): Promise<boolean> {
    if (this.provider === 'none') {
      this.logger.warn(
        `SMS отправка отключена (SMS_PROVIDER=none), сообщение для ${maskPhone(phone)} не отправлено`,
      );
      return false;
    }

    return this.deliver(phone, text);
  }

  /** Переопределяется при подключении реального шлюза. */
  protected async deliver(phone: string, text: string): Promise<boolean> {
    this.logger.log(`[SMS:${this.provider}] ${maskPhone(phone)} → ${text}`);
    return true;
  }
}
