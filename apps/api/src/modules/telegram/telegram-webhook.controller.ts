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

interface TelegramUpdate {
  message?: {
    text?: string;
    chat?: { id?: number };
  };
}

@ApiExcludeController()
@Controller('telegram')
export class TelegramWebhookController {
  private readonly logger = new Logger(TelegramWebhookController.name);

  constructor(private readonly telegramService: TelegramService) {}

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
    const text = update.message?.text?.trim() ?? '';
    const chatId = update.message?.chat?.id;

    if (chatId && /^\/start(?:@\w+)?(?:\s|$)/i.test(text)) {
      this.logger.log(`Получен /start от chat ${chatId}`);
      // Отвечаем Telegram сразу, welcome шлём асинхронно (чтобы не ловить 15s timeout).
      void this.telegramService.sendWelcome(String(chatId)).then((ok) => {
        if (!ok) {
          this.logger.error(`Welcome не удалось отправить в chat ${chatId}`);
        }
      });
    }

    return { ok: true };
  }
}
