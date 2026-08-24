import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Отправка писем. Провайдер задаётся env MAIL_PROVIDER:
 *  - `console` (по умолчанию) — письмо пишется в лог сервера;
 *  - `none` — отправка отключена.
 * Точка подключения SMTP (Mail.ru для бизнеса, Yandex 360 и т.п.) — метод deliver().
 */
@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);

  constructor(private readonly configService: ConfigService) {}

  get provider(): string {
    return this.configService.get<string>('mail.provider') ?? 'console';
  }

  async send(to: string, subject: string, text: string): Promise<boolean> {
    if (this.provider === 'none') {
      this.logger.warn(
        `Mail отправка отключена (MAIL_PROVIDER=none), письмо для ${to} не отправлено`,
      );
      return false;
    }

    return this.deliver(to, subject, text);
  }

  /** Переопределяется при подключении SMTP. */
  protected async deliver(to: string, subject: string, text: string): Promise<boolean> {
    this.logger.log(`[MAIL:${this.provider}] to=${to} subject="${subject}"\n${text}`);
    return true;
  }
}
