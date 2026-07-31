import {
  Controller,
  Headers,
  HttpCode,
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
  constructor(private readonly telegramService: TelegramService) {}

  @Public()
  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(
    @Req() req: Request,
    @Headers('x-telegram-bot-api-secret-token') secretToken?: string,
  ): Promise<{ ok: true }> {
    const expectedSecret = this.telegramService.getWebhookSecret();
    if (expectedSecret && secretToken !== expectedSecret) {
      throw new UnauthorizedException('Invalid telegram webhook secret');
    }

    const update = req.body as TelegramUpdate;
    const text = update.message?.text?.trim() ?? '';
    const chatId = update.message?.chat?.id;

    if (chatId && /^\/start(?:@\w+)?(?:\s|$)/i.test(text)) {
      await this.telegramService.sendWelcome(String(chatId));
    }

    return { ok: true };
  }
}
