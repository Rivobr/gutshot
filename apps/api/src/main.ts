import { join } from 'path';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('api/v1');
  app.enableCors();

  // Загруженные файлы (фото рассылок): /api/v1/uploads/<путь из photoPath>.
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/api/v1/uploads' });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('GUTSHOT Poker Club API')
    .setDescription('REST API для Telegram Mini App и Admin Panel клуба GUTSHOT')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.API_PORT ?? 3000;
  await app.listen(port);
}

bootstrap();
