import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TelegramService } from './telegram.service';
import { NotificationsService } from './notifications.service';
import { TelegramWebhookController } from './telegram-webhook.controller';
import { TelegramBotBootstrap } from './telegram-bot.bootstrap';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: { expiresIn: configService.get<string>('jwt.expiresIn') },
      }),
    }),
  ],
  controllers: [TelegramWebhookController],
  providers: [TelegramService, NotificationsService, TelegramBotBootstrap],
  exports: [TelegramService, NotificationsService],
})
export class TelegramModule {}
