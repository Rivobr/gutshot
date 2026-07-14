import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import appConfig from '../../config/app.config';
import databaseConfig from '../../config/database.config';
import jwtConfig from '../../config/jwt.config';
import redisConfig from '../../config/redis.config';
import telegramConfig from '../../config/telegram.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, redisConfig, telegramConfig],
      envFilePath: ['.env'],
    }),
  ],
})
export class ConfigurationModule {}
