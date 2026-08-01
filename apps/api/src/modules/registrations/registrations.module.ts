import { Module } from '@nestjs/common';
import { TelegramModule } from '../telegram/telegram.module';
import { ProgressionModule } from '../progression/progression.module';
import { RegistrationsService } from './registrations.service';
import { RegistrationsController } from './registrations.controller';

@Module({
  imports: [TelegramModule, ProgressionModule],
  controllers: [RegistrationsController],
  providers: [RegistrationsService],
  exports: [RegistrationsService],
})
export class RegistrationsModule {}
