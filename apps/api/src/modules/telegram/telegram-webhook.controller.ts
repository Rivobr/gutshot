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

interface TelegramPhotoSize {
  file_id: string;
  width: number;
  height: number;
  file_size?: number;
}

interface TelegramVideo {
  file_id: string;
  duration?: number;
  width?: number;
  height?: number;
  mime_type?: string;
  file_name?: string;
}

interface TelegramUpdate {
  message?: {
    text?: string;
    chat?: { id?: number };
    from?: { id?: number; username?: string };
    photo?: TelegramPhotoSize[];
    video?: TelegramVideo;
    video_note?: { file_id: string; length?: number; duration?: number };
    animation?: TelegramVideo;
    document?: { file_id: string; mime_type?: string; file_name?: string };
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
    const fromId = update.message?.from?.id;
    const fromUser = update.message?.from?.username;
    const photos = update.message?.photo ?? [];
    if (photos.length > 0) {
      const best = photos[photos.length - 1];
      this.logger.log(
        `INBOUND_PHOTO chat=${chatId ?? ''} from=${fromId ?? ''} @${fromUser ?? ''} ` +
          `file_id=${best.file_id} ${best.width}x${best.height}`,
      );
    }
    const video = update.message?.video;
    if (video?.file_id) {
      this.logger.log(
        `INBOUND_VIDEO chat=${chatId ?? ''} from=${fromId ?? ''} @${fromUser ?? ''} ` +
          `file_id=${video.file_id} ${video.width ?? ''}x${video.height ?? ''} ` +
          `dur=${video.duration ?? ''} mime=${video.mime_type ?? ''} name=${video.file_name ?? ''}`,
      );
    }
    const videoNote = update.message?.video_note;
    if (videoNote?.file_id) {
      this.logger.log(
        `INBOUND_VIDEO_NOTE chat=${chatId ?? ''} from=${fromId ?? ''} @${fromUser ?? ''} ` +
          `file_id=${videoNote.file_id}`,
      );
    }
    const animation = update.message?.animation;
    if (animation?.file_id) {
      this.logger.log(
        `INBOUND_ANIMATION chat=${chatId ?? ''} from=${fromId ?? ''} @${fromUser ?? ''} ` +
          `file_id=${animation.file_id} mime=${animation.mime_type ?? ''}`,
      );
    }
    const doc = update.message?.document;
    if (doc?.file_id) {
      this.logger.log(
        `INBOUND_DOCUMENT chat=${chatId ?? ''} from=${fromId ?? ''} @${fromUser ?? ''} ` +
          `file_id=${doc.file_id} mime=${doc.mime_type ?? ''} name=${doc.file_name ?? ''}`,
      );
    }

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
