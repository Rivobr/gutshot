import {
  Controller,
  Headers,
  HttpCode,
  Logger,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { TelegramService } from './telegram.service';
import {
  TelegramCallbackQuery,
  TelegramRsvpService,
} from './telegram-rsvp.service';

interface TelegramUpdate {
  message?: {
    text?: string;
    chat?: { id?: number };
  };
  callback_query?: TelegramCallbackQuery;
}

@ApiExcludeController()
@Controller('telegram')
export class TelegramWebhookController {
  private readonly logger = new Logger(TelegramWebhookController.name);

  constructor(
    private readonly telegramService: TelegramService,
    private readonly telegramRsvpService: TelegramRsvpService,
  ) {}

  @Public()
  @Post('webhook')
  @HttpCode(200)
  handleWebhook(
    @Req() req: Request,
    @Headers('x-telegram-bot-api-secret-token') secretToken?: string,
  ): { ok: true } {
    const expectedSecret = this.telegramService.getWebhookSecret();
    if (expectedSecret && secretToken !== expectedSecret) {
      this.logger.warn('Webhook отклонён: неверный secret token');
      throw new UnauthorizedException('Invalid telegram webhook secret');
    }

    const update = req.body as TelegramUpdate;

    if (update.callback_query) {
      const callbackId = update.callback_query.id;
      this.logger.log(
        `callback_query ${callbackId} data=${update.callback_query.data ?? ''} from=${update.callback_query.from?.id ?? ''}`,
      );
      void this.telegramRsvpService.handleCallback(update.callback_query).catch((error) => {
        this.logger.error(`RSVP callback failed ${callbackId}`, error as Error);
        void this.telegramService.answerCallbackQuery(callbackId, 'Ошибка, попробуйте ещё раз');
      });
      return { ok: true };
    }

    const text = update.message?.text?.trim() ?? '';
    const chatId = update.message?.chat?.id;

    // /start и запасные команды — после ребута VPS люди пишут «открыть» / жмут старые кнопки.
    if (chatId && this.shouldSendWelcome(text)) {
      this.logger.log(`Получен вход-команда от chat ${chatId}: ${text.slice(0, 40)}`);
      // Отвечаем Telegram сразу, welcome шлём асинхронно (чтобы не ловить 15s timeout).
      void this.telegramService.sendWelcome(String(chatId)).then((ok) => {
        if (!ok) {
          this.logger.error(`Welcome не удалось отправить в chat ${chatId}`);
        }
      });
    }

    return { ok: true };
  }

  private shouldSendWelcome(text: string): boolean {
    if (!text) {
      return false;
    }
    if (/^\/(?:start|open|app|club|gutshot)(?:@\w+)?(?:\s|$)/i.test(text)) {
      return true;
    }
    // Простые фразы, когда игрок пишет «не открывается» после даунтайма.
    return /^(?:открыть|клуб|войти|вход|мини.?апп|mini.?app|app|open)\s*[!.]?$/i.test(text);
  }
}
