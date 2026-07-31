import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegramService } from './telegram.service';

@Injectable()
export class TelegramBotBootstrap implements OnModuleInit {
  private readonly logger = new Logger(TelegramBotBootstrap.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly telegramService: TelegramService,
  ) {}

  async onModuleInit(): Promise<void> {
    const apiUrl = this.configService.get<string>('app.url')?.replace(/\/$/, '');
    const botToken = this.configService.get<string>('telegram.botToken');

    if (!botToken || !apiUrl) {
      this.logger.warn('Webhook не установлен: нужны TELEGRAM_BOT_TOKEN и API_URL');
      return;
    }

    if (!apiUrl.startsWith('https://')) {
      this.logger.warn(`Webhook пропущен: API_URL должен быть https (${apiUrl})`);
      return;
    }

    await this.telegramService.setWebhook(`${apiUrl}/api/v1/telegram/webhook`);
  }
}
