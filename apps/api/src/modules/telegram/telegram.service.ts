import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { WELCOME_CAPTION } from './welcome-message';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly botToken: string | undefined;
  private readonly webhookSecret: string | undefined;
  private welcomePhotoFileId: string | undefined;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    this.botToken = this.configService.get<string>('telegram.botToken');
    this.webhookSecret = this.configService.get<string>('telegram.webhookSecret');
  }

  getWebhookSecret(): string | undefined {
    return this.webhookSecret;
  }

  private getWelcomePhotoPath(): string {
    return join(process.cwd(), 'assets', 'welcome-club.png');
  }

  async sendMessage(telegramId: string, text: string, replyMarkup?: object): Promise<boolean> {
    if (!this.botToken) {
      this.logger.warn('TELEGRAM_BOT_TOKEN не задан — сообщение не отправлено');
      return false;
    }

    try {
      const body: Record<string, unknown> = {
        chat_id: telegramId,
        text,
        parse_mode: 'HTML',
      };
      if (replyMarkup) {
        body.reply_markup = replyMarkup;
      }

      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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

    // Снимаем старую reply-клавиатуру («Открыть клуб»), если она уже была у пользователя.
    const removeKeyboard = { remove_keyboard: true };
    const miniAppUrl = (
      this.configService.get<string>('telegram.miniAppPublicUrl')?.trim() ||
      this.configService.get<string>('telegram.miniAppUrl')?.trim() ||
      'https://app.gutshotapp.ru'
    ).replace(/\/$/, '');
    // boot.html + per-user ticket: some WebViews (CF tunnel) omit initData;
    // ticket lets boot.html auth without Telegram.WebApp.initData.
    const ticket = this.jwtService.sign(
      { typ: 'miniapp_ticket', telegramId: String(chatId) },
      { expiresIn: '7d' },
    );
    const entryUrl = `${miniAppUrl}/enter.html?t=${Date.now()}&v=20260807d&ticket=${encodeURIComponent(ticket)}`;
    const openAppKeyboard = {
      inline_keyboard: [[{ text: '♠️ Открыть GUTSHOT', web_app: { url: entryUrl } }]],
    };

    try {
      const photoSent = await this.sendWelcomePhoto(chatId);
      if (!photoSent) {
        this.logger.warn(`Welcome photo не отправлено в chat ${chatId}, шлём только текст`);
      }

      // Сначала убираем старую reply-клавиатуру, затем шлём кнопку web_app.
      await this.sendMessage(chatId, WELCOME_CAPTION, removeKeyboard);
      const buttonOk = await this.sendMessage(
        chatId,
        'Нажмите кнопку, чтобы открыть приложение:',
        openAppKeyboard,
      );
      if (!buttonOk) {
        this.logger.error(`Welcome button не отправлена в chat ${chatId}`);
        return false;
      }

      this.logger.log(`Welcome отправлен в chat ${chatId}`);
      return true;
    } catch (error) {
      this.logger.error(`Ошибка отправки welcome в chat ${chatId}`, error as Error);
      return this.sendMessage(chatId, WELCOME_CAPTION, openAppKeyboard);
    }
  }

  private async sendWelcomePhoto(chatId: string): Promise<boolean> {
    if (this.welcomePhotoFileId) {
      const ok = await this.sendPhotoByFileId(chatId, this.welcomePhotoFileId);
      if (ok) {
        return true;
      }
      this.welcomePhotoFileId = undefined;
    }

    try {
      const photoBuffer = await readFile(this.getWelcomePhotoPath());
      const form = new FormData();
      form.append('chat_id', chatId);
      form.append(
        'photo',
        new Blob([new Uint8Array(photoBuffer)], { type: 'image/png' }),
        'welcome-club.png',
      );

      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendPhoto`, {
        method: 'POST',
        body: form,
      });

      if (!response.ok) {
        this.logger.error(`Telegram sendPhoto error: ${response.status} ${await response.text()}`);
        return false;
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
      this.logger.error(
        `Не удалось прочитать/отправить welcome photo: ${(error as Error).message}`,
      );
      return false;
    }
  }

  private async sendPhotoByFileId(chatId: string, fileId: string): Promise<boolean> {
    const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        photo: fileId,
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

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2_500);

    try {
      const photosResponse = await fetch(
        `https://api.telegram.org/bot${this.botToken}/getUserProfilePhotos?user_id=${encodeURIComponent(telegramId)}&limit=1`,
        { signal: controller.signal },
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
        { signal: controller.signal },
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
      this.logger.warn(
        `Не удалось получить аватар Telegram ${telegramId}: ${(error as Error).message}`,
      );
      return undefined;
    } finally {
      clearTimeout(timer);
    }
  }

  async getWebhookInfo(): Promise<{
    url?: string;
    lastErrorMessage?: string;
    pendingUpdateCount?: number;
  } | null> {
    if (!this.botToken) {
      return null;
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/getWebhookInfo`);
      const payload = (await response.json()) as {
        ok?: boolean;
        result?: {
          url?: string;
          last_error_message?: string;
          pending_update_count?: number;
        };
      };
      if (!payload.ok || !payload.result) {
        return null;
      }
      return {
        url: payload.result.url,
        lastErrorMessage: payload.result.last_error_message,
        pendingUpdateCount: payload.result.pending_update_count,
      };
    } catch {
      return null;
    }
  }

  /**
   * Кнопка меню слева от поля ввода. Должна открывать Mini App,
   * а не админ-панель — иначе игроки видят CRM-логин.
   */
  async setChatMenuButton(miniAppUrl: string, text = 'Открыть'): Promise<boolean> {
    if (!this.botToken) {
      this.logger.warn('TELEGRAM_BOT_TOKEN не задан — menu button не установлен');
      return false;
    }

    const url = miniAppUrl.replace(/\/$/, '');
    if (!url.startsWith('https://')) {
      this.logger.error(`Menu button: нужен https URL, получено: ${miniAppUrl}`);
      return false;
    }
    if (/admin/i.test(url)) {
      this.logger.error(`Menu button: отказ — URL похож на админку: ${url}`);
      return false;
    }

    try {
      const response = await fetch(
        `https://api.telegram.org/bot${this.botToken}/setChatMenuButton`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            menu_button: {
              type: 'web_app',
              text,
              web_app: { url },
            },
          }),
        },
      );

      const result = (await response.json()) as { ok?: boolean; description?: string };
      if (!response.ok || !result.ok) {
        this.logger.error(`setChatMenuButton failed: ${result.description ?? response.status}`);
        return false;
      }

      this.logger.log(`Telegram menu button → Mini App: ${url}`);
      return true;
    } catch (error) {
      this.logger.error('Ошибка setChatMenuButton', error as Error);
      return false;
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
        this.logger.error(`setWebhook failed: ${result.description ?? response.status}`);
        return false;
      }

      this.logger.log(`Telegram webhook установлен: ${webhookUrl}`);
      const info = await this.getWebhookInfo();
      if (info) {
        this.logger.log(
          `Webhook info: url=${info.url ?? '—'}, pending=${info.pendingUpdateCount ?? 0}` +
            (info.lastErrorMessage ? `, last_error=${info.lastErrorMessage}` : ''),
        );
      }
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
    tournamentFinished: (tournamentTitle: string, place: number, points: number): string =>
      `🏁 Турнир «${tournamentTitle}» завершен. Ваше место: ${place}. Начислено очков: +${points}.`,
    xpAwarded: (amount: number): string => `⭐ Начислено ${amount} XP.`,
    levelUp: (level: number): string => `🚀 Новый уровень: ${level}!`,
  };
}
