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
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { TelegramService } from './telegram.service';
import { TelegramCallbackQuery, TelegramRsvpService } from './telegram-rsvp.service';
import { claimPendingTelegramUser } from '../../common/utils/pending-telegram-user';

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
    from?: { id?: number; username?: string; first_name?: string; last_name?: string };
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
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
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

    const inboundFrom = update.callback_query?.from ?? update.message?.from;
    this.claimPendingFromInbound(inboundFrom);

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

    // /link <код> — привязка Telegram к аккаунту с сайта (один игрок, второй не создаётся).
    const linkMatch = chatId ? text.match(/^\/link(?:@\w+)?\s+([A-Za-z0-9._-]+)$/) : null;
    if (linkMatch) {
      void this.handleTelegramLink(linkMatch[1], String(chatId), fromUser ?? null);
    }

    return { ok: true };
  }

  private async handleTelegramLink(
    code: string,
    chatId: string,
    username: string | null,
  ): Promise<void> {
    try {
      let payload: { typ?: string; sub?: string };
      try {
        payload = this.jwtService.verify(code) as { typ?: string; sub?: string };
      } catch {
        await this.telegramService.sendMessage(
          chatId,
          '⚠️ Код привязки неверен или устарел. Получите новый на сайте: Профиль → Привязать Telegram.',
        );
        return;
      }

      if (payload.typ !== 'tg_link' || !payload.sub) {
        await this.telegramService.sendMessage(chatId, '⚠️ Код привязки неверен.');
        return;
      }

      const existing = await this.prisma.user.findUnique({ where: { telegramId: chatId } });
      if (existing && existing.id !== payload.sub) {
        await this.telegramService.sendMessage(
          chatId,
          'Этот Telegram уже привязан к другому игроку. Если это ошибка — напишите @gutshot_suport.',
        );
        return;
      }

      await this.prisma.user.update({
        where: { id: payload.sub },
        data: { telegramId: chatId, username: username ?? undefined },
      });
      this.logger.log(`Telegram ${chatId} привязан к игроку ${payload.sub}`);
      await this.telegramService.sendMessage(
        chatId,
        '✅ Telegram привязан! Теперь вы можете входить на сайт одной кнопкой.',
      );
    } catch (error) {
      this.logger.error(`handleTelegramLink failed: ${(error as Error).message}`, error as Error);
      await this.telegramService
        .sendMessage(chatId, 'Не удалось привязать Telegram. Попробуйте ещё раз чуть позже.')
        .catch(() => undefined);
    }
  }

  private claimPendingFromInbound(from?: {
    id?: number;
    username?: string;
    first_name?: string;
    last_name?: string;
  }): void {
    if (!from?.id || !from.username) {
      return;
    }

    void claimPendingTelegramUser(this.prisma, {
      telegramId: String(from.id),
      username: from.username,
      firstName: from.first_name ?? null,
      lastName: from.last_name ?? null,
    })
      .then((claimed) => {
        if (claimed && claimed.telegramId === String(from.id)) {
          this.logger.log(`Синхронизирован временный игрок @${from.username} → ${from.id}`);
        }
      })
      .catch((error) => {
        this.logger.warn(
          `Не удалось синхронизировать @${from.username}: ${(error as Error).message}`,
        );
      });
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
