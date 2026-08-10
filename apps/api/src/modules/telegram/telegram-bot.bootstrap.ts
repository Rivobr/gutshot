import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegramService } from './telegram.service';

const PRODUCTION_WEBHOOK = 'https://api.gutshotapp.ru/api/v1/telegram/webhook';

@Injectable()
export class TelegramBotBootstrap implements OnModuleInit {
  private readonly logger = new Logger(TelegramBotBootstrap.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly telegramService: TelegramService,
  ) {}

  async onModuleInit(): Promise<void> {
    const botToken = this.configService.get<string>('telegram.botToken');
    if (!botToken) {
      this.logger.warn('Webhook не установлен: нет TELEGRAM_BOT_TOKEN');
      return;
    }

    const webhookUrl = this.resolveWebhookUrl();
    if (!webhookUrl) {
      this.logger.warn(
        'Webhook не установлен: задайте API_URL=https://... или TELEGRAM_WEBHOOK_URL',
      );
      return;
    }

    const ok = await this.withRetries(
      () => this.telegramService.setWebhook(webhookUrl),
      `setWebhook ${webhookUrl}`,
    );
    if (!ok) {
      this.logger.error(`Не удалось установить webhook: ${webhookUrl}`);
    }

    const miniAppUrl = this.resolveMiniAppUrl();
    if (!miniAppUrl) {
      this.logger.error(
        'Menu button не установлен: задайте MINI_APP_URL=https://app.gutshotapp.ru (не admin!)',
      );
      return;
    }

    // enter.html — новый entry без кэша старого /t.html (NotFound в Telegram WebView).
    // ?v= ломает кэш WebView Telegram после фиксов входа.
    const entryUrl = `${miniAppUrl}/enter.html?v=20260810c`;
    const menuOk = await this.withRetries(
      () => this.telegramService.setChatMenuButton(entryUrl),
      `setChatMenuButton ${entryUrl}`,
    );
    if (!menuOk) {
      this.logger.error(`Не удалось установить menu button: ${miniAppUrl}`);
    }
  }

  /** Telegram API иногда недоступен в момент старта контейнера — пробуем несколько раз. */
  private async withRetries(
    action: () => Promise<boolean>,
    label: string,
    attempts = 5,
  ): Promise<boolean> {
    for (let i = 1; i <= attempts; i += 1) {
      const ok = await action();
      if (ok) {
        return true;
      }
      if (i < attempts) {
        const delayMs = Math.min(8000, 500 * 2 ** (i - 1));
        this.logger.warn(
          `${label}: попытка ${i}/${attempts} не удалась, повтор через ${delayMs}ms`,
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
    return false;
  }

  private resolveMiniAppUrl(): string | undefined {
    const raw =
      this.configService.get<string>('telegram.miniAppPublicUrl')?.trim() ||
      this.configService.get<string>('telegram.miniAppUrl')?.trim();
    const url = (raw || 'https://app.gutshotapp.ru').replace(/\/$/, '');
    if (!url.startsWith('https://') || /admin/i.test(url)) {
      this.logger.error(`Некорректный MINI_APP_URL: ${raw ?? '—'}`);
      return undefined;
    }
    return url;
  }

  private resolveWebhookUrl(): string | undefined {
    const explicit = this.configService.get<string>('telegram.webhookUrl')?.replace(/\/$/, '');
    if (explicit?.startsWith('https://')) {
      return explicit;
    }

    const apiUrl = this.configService.get<string>('app.url')?.replace(/\/$/, '');
    if (apiUrl?.startsWith('https://')) {
      return `${apiUrl}/api/v1/telegram/webhook`;
    }

    // На сервере часто оставляют API_URL=http://localhost из примера —
    // исходящие уведомления работают, а /start нет, т.к. webhook не ставится.
    if (process.env.NODE_ENV === 'production') {
      this.logger.warn(
        `API_URL не https (${apiUrl ?? 'не задан'}) — fallback webhook: ${PRODUCTION_WEBHOOK}`,
      );
      return PRODUCTION_WEBHOOK;
    }

    return undefined;
  }
}
