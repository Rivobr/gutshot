import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { NotificationsService } from './notifications.service';
import { TelegramWebhookController } from './telegram-webhook.controller';
import { TelegramBotBootstrap } from './telegram-bot.bootstrap';

@Module({
  controllers: [TelegramWebhookController],
  providers: [TelegramService, NotificationsService, TelegramBotBootstrap],
  exports: [TelegramService, NotificationsService],
})
export class TelegramModule {}
