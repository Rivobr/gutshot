import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AppModule (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/v1/auth/telegram без initData возвращает 400', async () => {
    const response = await request(app.getHttpServer()).post('/api/v1/auth/telegram').send({});
    expect(response.status).toBe(400);
  });

  it('GET /api/v1/profile без токена возвращает 401', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/profile');
    expect(response.status).toBe(401);
  });
});
