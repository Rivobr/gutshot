import { Module } from '@nestjs/common';
import { TelegramModule } from '../telegram/telegram.module';
import { RemindersService } from './reminders.service';

@Module({
  imports: [TelegramModule],
  providers: [RemindersService],
})
export class RemindersModule {}
