import { Module } from '@nestjs/common';
import { QrModule } from '../qr/qr.module';
import { TelegramModule } from '../telegram/telegram.module';
import { RegistrationsService } from './registrations.service';
import { RegistrationsController } from './registrations.controller';

@Module({
  imports: [QrModule, TelegramModule],
  controllers: [RegistrationsController],
  providers: [RegistrationsService],
  exports: [RegistrationsService],
})
export class RegistrationsModule {}
