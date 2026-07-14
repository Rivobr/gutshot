import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { NotificationsService } from './notifications.service';

@Module({
  providers: [TelegramService, NotificationsService],
  exports: [TelegramService, NotificationsService],
})
export class TelegramModule {}
