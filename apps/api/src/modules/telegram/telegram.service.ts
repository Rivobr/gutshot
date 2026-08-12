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
    const result = await this.sendMessageDetailed(telegramId, text, replyMarkup);
    return result != null;
  }

  /** sendMessage с message_id — для логов рассылок. */
  async sendMessageDetailed(
    telegramId: string,
    text: string,
    replyMarkup?: object,
  ): Promise<{ messageId: number; chatId: number } | null> {
    const result = await this.callTelegramApi('sendMessage', {
      chat_id: telegramId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
    });
    if (!result) {
      return null;
    }
    const messageId = Number(result.message_id);
    const chatId = Number((result.chat as { id?: number } | undefined)?.id ?? telegramId);
    if (!Number.isFinite(messageId)) {
      return null;
    }
    return { messageId, chatId };
  }

  /** Удалить сообщение бота (по сохранённому message_id рассылки). */
  async deleteMessage(chatId: string | number, messageId: number): Promise<boolean> {
    const result = await this.callTelegramApi('deleteMessage', {
      chat_id: chatId,
      message_id: messageId,
    });
    return result != null;
  }

  /** Inline-кнопка «Открыть клуб» с персональным ticket. */
  buildOpenAppKeyboard(telegramId: string): object {
    const miniAppUrl = (
      this.configService.get<string>('telegram.miniAppPublicUrl')?.trim() ||
      this.configService.get<string>('telegram.miniAppUrl')?.trim() ||
      'https://app.gutshotapp.ru'
    ).replace(/\/$/, '');
    const ticket = this.jwtService.sign(
      { typ: 'miniapp_ticket', telegramId: String(telegramId) },
      { expiresIn: '7d' },
    );
    const entryUrl = `${miniAppUrl}/enter.html?t=${Date.now()}&v=20260810c&ticket=${encodeURIComponent(ticket)}`;
    return {
      inline_keyboard: [[{ text: '♠️ Открыть клуб', web_app: { url: entryUrl } }]],
    };
  }

  /** Inline-кнопки RSVP явки на турнир. */
  buildRsvpKeyboard(tournamentId: string): object {
    return {
      inline_keyboard: [
        [
          { text: '✅ Буду', callback_data: `rsvp:y:${tournamentId}` },
          { text: '❌ Не смогу', callback_data: `rsvp:n:${tournamentId}` },
        ],
      ],
    };
  }

  /** Ответ на нажатие inline-кнопки (обязателен, иначе у игрока крутится лоадер). */
  async answerCallbackQuery(callbackQueryId: string, text?: string): Promise<boolean> {
    const result = await this.callTelegramApi('answerCallbackQuery', {
      callback_query_id: callbackQueryId,
      ...(text ? { text } : {}),
    });
    return result != null;
  }

  /** Правит текст сообщения и снимает кнопки (после RSVP). */
  async editMessageText(
    chatId: string | number,
    messageId: number,
    text: string,
  ): Promise<boolean> {
    const result = await this.callTelegramApi('editMessageText', {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: [] },
    });
    return result != null;
  }

  /**
   * Вызов Telegram Bot API с ретраями.
   * Outbound с VPS иногда падает (DNS/сеть) — без ретраев кнопки «молчат».
   */
  private async callTelegramApi(
    method: string,
    body: Record<string, unknown>,
  ): Promise<Record<string, unknown> | null> {
    if (!this.botToken) {
      this.logger.warn(`TELEGRAM_BOT_TOKEN не задан — ${method} не выполнен`);
      return null;
    }

    let lastError: unknown;
    for (let attempt = 1; attempt <= 4; attempt += 1) {
      try {
        const response = await fetch(`https://api.telegram.org/bot${this.botToken}/${method}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(8_000),
        });

        if (!response.ok) {
          const raw = await response.text();
          this.logger.error(`Telegram ${method} error: ${response.status} ${raw}`);
          if (response.status < 500 && response.status !== 429) {
            return null;
          }
          throw new Error(`http ${response.status}`);
        }

        const payload = (await response.json()) as { ok?: boolean; result?: Record<string, unknown> };
        return payload.result ?? {};
      } catch (error) {
        lastError = error;
        this.logger.warn(
          `Telegram ${method} attempt ${attempt}/4 failed: ${(error as Error).message}`,
        );
        await new Promise((r) => setTimeout(r, 500 * attempt));
      }
    }

    this.logger.error(`Ошибка Telegram ${method}`, lastError as Error);
    return null;
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
    const entryUrl = `${miniAppUrl}/enter.html?t=${Date.now()}&v=20260810c&ticket=${encodeURIComponent(ticket)}`;
    const openAppKeyboard = {
      inline_keyboard: [[{ text: '♠️ Открыть GUTSHOT', web_app: { url: entryUrl } }]],
    };

    try {
      const photoSent = await this.sendWelcomePhoto(chatId);
      if (!photoSent) {
        this.logger.warn(`Welcome photo не отправлено в chat ${chatId}, шлём только текст`);
      }

      // Персональная кнопка меню с ticket: глобальная кнопка его не содержит,
      // и на WebView без initData вход упирался в «Откройте кнопкой из бота».
      void this.setChatMenuButton(entryUrl, 'Открыть', String(chatId)).catch(() => undefined);

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

      // Never return/persist bot-token file URLs — они светят TELEGRAM_BOT_TOKEN
      // в admin/API ответах. Аватар из initData (CDN t.me) безопасен.
      this.logger.debug(
        `Telegram avatar file for ${telegramId} resolved but skipped (token leak guard)`,
      );
      return undefined;
    } catch (error) {
      this.logger.warn(
        `Не удалось получить аватар Telegram ${telegramId}: ${(error as Error).message}`,
      );
      return undefined;
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Профиль игрока через Bot API.
   * Нужен для входов по ticket/кнопке бота, где нет initData:
   * иначе в админке игрок остаётся без имени и @username.
   * chatId — числовой telegram id или @username.
   */
  async getChatProfile(chatId: string): Promise<{
    telegramId?: string | null;
    username?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  } | null> {
    if (!this.botToken) {
      return null;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2_500);

    try {
      const response = await fetch(
        `https://api.telegram.org/bot${this.botToken}/getChat?chat_id=${encodeURIComponent(chatId)}`,
        { signal: controller.signal },
      );
      const payload = (await response.json()) as {
        ok?: boolean;
        result?: {
          id?: number | string;
          username?: string;
          first_name?: string;
          last_name?: string;
        };
      };

      if (!payload.ok || !payload.result) {
        return null;
      }

      const telegramId = payload.result.id != null ? String(payload.result.id) : null;

      return {
        telegramId,
        username: payload.result.username ?? null,
        firstName: payload.result.first_name ?? null,
        lastName: payload.result.last_name ?? null,
      };
    } catch (error) {
      this.logger.warn(
        `Не удалось получить профиль Telegram ${chatId}: ${(error as Error).message}`,
      );
      return null;
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
  async setChatMenuButton(miniAppUrl: string, text = 'Открыть', chatId?: string): Promise<boolean> {
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

    const body: Record<string, unknown> = {
      menu_button: {
        type: 'web_app',
        text,
        web_app: { url },
      },
    };
    if (chatId) {
      body.chat_id = Number(chatId);
    }

    let lastError: unknown;
    for (let attempt = 1; attempt <= 4; attempt += 1) {
      try {
        const response = await fetch(
          `https://api.telegram.org/bot${this.botToken}/setChatMenuButton`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(8_000),
          },
        );

        const result = (await response.json()) as { ok?: boolean; description?: string };
        if (!response.ok || !result.ok) {
          this.logger.error(`setChatMenuButton failed: ${result.description ?? response.status}`);
          if (response.status < 500 && response.status !== 429) {
            return false;
          }
          throw new Error(`http ${response.status}`);
        }

        if (!chatId) {
          this.logger.log(`Telegram menu button → Mini App: ${url}`);
        }
        return true;
      } catch (error) {
        lastError = error;
        this.logger.warn(
          `setChatMenuButton attempt ${attempt}/4 failed: ${(error as Error).message}`,
        );
        await new Promise((r) => setTimeout(r, 500 * attempt));
      }
    }

    this.logger.error('Ошибка setChatMenuButton', lastError as Error);
    return false;
  }

  async setWebhook(webhookUrl: string): Promise<boolean> {
    if (!this.botToken) {
      this.logger.warn('TELEGRAM_BOT_TOKEN не задан — webhook не установлен');
      return false;
    }

    try {
      const body: Record<string, unknown> = {
        url: webhookUrl,
        // message — /start и команды; callback_query — inline-кнопки (RSVP и т.п.)
        allowed_updates: ['message', 'callback_query'],
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
