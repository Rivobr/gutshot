import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { WELCOME_CAPTION } from './welcome-message';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly botToken: string | undefined;
  private readonly miniAppUrl: string | undefined;
  private readonly webhookSecret: string | undefined;
  private welcomePhotoFileId: string | undefined;

  constructor(private readonly configService: ConfigService) {
    this.botToken = this.configService.get<string>('telegram.botToken');
    this.miniAppUrl = this.configService.get<string>('telegram.miniAppUrl');
    this.webhookSecret = this.configService.get<string>('telegram.webhookSecret');
  }

  getWebhookSecret(): string | undefined {
    return this.webhookSecret;
  }

  private getWelcomePhotoPath(): string {
    return join(process.cwd(), 'assets', 'welcome-club.png');
  }

  private webAppKeyboard() {
    if (!this.miniAppUrl) {
      return undefined;
    }

    return {
      keyboard: [
        [
          {
            text: '♠️ Открыть клуб',
            web_app: { url: this.miniAppUrl },
          },
        ],
      ],
      resize_keyboard: true,
    };
  }

  async sendMessage(telegramId: string, text: string): Promise<boolean> {
    if (!this.botToken) {
      this.logger.warn('TELEGRAM_BOT_TOKEN не задан — сообщение не отправлено');
      return false;
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramId,
          text,
          parse_mode: 'HTML',
        }),
      });

      if (!response.ok) {
        this.logger.error(`Telegram API error: ${response.status} ${await response.text()}`);
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error('Ошибка отправки Telegram сообщения', error as Error);
      return false;
    }
  }

  async sendWelcome(chatId: string): Promise<boolean> {
    if (!this.botToken) {
      this.logger.warn('TELEGRAM_BOT_TOKEN не задан — welcome не отправлен');
      return false;
    }

    const replyMarkup = this.webAppKeyboard();

    try {
      if (this.welcomePhotoFileId) {
        const ok = await this.sendPhotoByFileId(chatId, this.welcomePhotoFileId, WELCOME_CAPTION, replyMarkup);
        if (ok) {
          return true;
        }
        this.welcomePhotoFileId = undefined;
      }

      const photoBuffer = await readFile(this.getWelcomePhotoPath());
      const form = new FormData();
      form.append('chat_id', chatId);
      form.append('caption', WELCOME_CAPTION);
      form.append('parse_mode', 'HTML');
      form.append(
        'photo',
        new Blob([new Uint8Array(photoBuffer)], { type: 'image/png' }),
        'welcome-club.png',
      );
      if (replyMarkup) {
        form.append('reply_markup', JSON.stringify(replyMarkup));
      }

      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendPhoto`, {
        method: 'POST',
        body: form,
      });

      if (!response.ok) {
        this.logger.error(`Telegram sendPhoto error: ${response.status} ${await response.text()}`);
        return this.sendMessage(chatId, WELCOME_CAPTION);
      }

      const payload = (await response.json()) as {
        ok?: boolean;
        result?: { photo?: Array<{ file_id: string }> };
      };
      const photos = payload.result?.photo;
      if (photos?.length) {
        this.welcomePhotoFileId = photos[photos.length - 1]?.file_id;
      }

      return true;
    } catch (error) {
      this.logger.error('Ошибка отправки welcome-сообщения', error as Error);
      return this.sendMessage(chatId, WELCOME_CAPTION);
    }
  }

  private async sendPhotoByFileId(
    chatId: string,
    fileId: string,
    caption: string,
    replyMarkup?: object,
  ): Promise<boolean> {
    const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        photo: fileId,
        caption,
        parse_mode: 'HTML',
        reply_markup: replyMarkup,
      }),
    });

    if (!response.ok) {
      this.logger.warn(`Telegram sendPhoto by file_id failed: ${response.status}`);
      return false;
    }

    return true;
  }

  /**
   * Берёт актуальную аватарку пользователя через Bot API.
   * photo_url из initData часто отсутствует, поэтому это основной источник.
   */
  async getUserProfilePhotoUrl(telegramId: string): Promise<string | undefined> {
    if (!this.botToken) {
      return undefined;
    }

    try {
      const photosResponse = await fetch(
        `https://api.telegram.org/bot${this.botToken}/getUserProfilePhotos?user_id=${encodeURIComponent(telegramId)}&limit=1`,
      );
      const photosPayload = (await photosResponse.json()) as {
        ok?: boolean;
        result?: { total_count?: number; photos?: Array<Array<{ file_id: string }>> };
      };

      const sizes = photosPayload.result?.photos?.[0] ?? [];
      const bestSize = sizes[sizes.length - 1];
      if (!photosPayload.ok || !bestSize?.file_id) {
        return undefined;
      }

      const fileResponse = await fetch(
        `https://api.telegram.org/bot${this.botToken}/getFile?file_id=${encodeURIComponent(bestSize.file_id)}`,
      );
      const filePayload = (await fileResponse.json()) as {
        ok?: boolean;
        result?: { file_path?: string };
      };

      if (!filePayload.ok || !filePayload.result?.file_path) {
        return undefined;
      }

      return `https://api.telegram.org/file/bot${this.botToken}/${filePayload.result.file_path}`;
    } catch (error) {
      this.logger.warn(`Не удалось получить аватар Telegram ${telegramId}: ${(error as Error).message}`);
      return undefined;
    }
  }

  async setWebhook(webhookUrl: string): Promise<boolean> {
    if (!this.botToken) {
      this.logger.warn('TELEGRAM_BOT_TOKEN не задан — webhook не установлен');
      return false;
    }

    try {
      const body: Record<string, unknown> = {
        url: webhookUrl,
        allowed_updates: ['message'],
        drop_pending_updates: false,
      };

      if (this.webhookSecret) {
        body.secret_token = this.webhookSecret;
      }

      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = (await response.json()) as { ok?: boolean; description?: string };
      if (!response.ok || !result.ok) {
        this.logger.error(`setWebhook failed: ${result.description ?? (await response.text())}`);
        return false;
      }

      this.logger.log(`Telegram webhook установлен: ${webhookUrl}`);
      return true;
    } catch (error) {
      this.logger.error('Ошибка setWebhook', error as Error);
      return false;
    }
  }

  templates = {
    registrationSuccess: (tournamentTitle: string): string =>
      `✅ Вы успешно зарегистрированы на турнир «${tournamentTitle}».`,
    movedFromWaiting: (tournamentTitle: string): string =>
      `🎉 Для вас освободилось место на турнире «${tournamentTitle}». Вы переведены в основной список.`,
    registrationCancelled: (tournamentTitle: string): string =>
      `❌ Регистрация на турнир «${tournamentTitle}» отменена.`,
    reminder: (tournamentTitle: string): string =>
      `⏰ Напоминаем: турнир «${tournamentTitle}» начнется через 2 часа.`,
    checkedIn: (): string => '✅ Вы успешно отметились. Удачи за столом!',
    tournamentFinished: (tournamentTitle: string, place: number, xp: number): string =>
      `🏁 Турнир «${tournamentTitle}» завершен. Ваше место: ${place}. Начислено XP: +${xp}.`,
    xpAwarded: (amount: number): string => `⭐ Начислено ${amount} XP.`,
    levelUp: (level: number): string => `🚀 Новый уровень: ${level}!`,
  };
}
