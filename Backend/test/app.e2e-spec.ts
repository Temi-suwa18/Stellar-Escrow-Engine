/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access,
   @typescript-eslint/no-unsafe-assignment --
   supertest's request() typing against Nest's getHttpServer() return type is a known gap;
   scoped to this e2e test harness, not application code. */
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('App (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    // Mirrors main.ts's bootstrap exactly (versioning included) so this suite
    // actually exercises the routes as they exist in production, instead of
    // silently testing a different app shape than the one that gets deployed.
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health/live returns 200 and echoes a request id', async () => {
    const response = await request(app.getHttpServer()).get('/health/live');

    expect(response.status).toBe(200);
    expect(response.headers['x-request-id']).toBeDefined();
    expect(response.body.status).toBe('ok');
  });

  it('unknown routes return the Stripe-style error envelope', async () => {
    const response = await request(app.getHttpServer()).get('/this-route-does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      error: {
        type: 'invalid_request_error',
        message: expect.any(String),
        requestId: expect.any(String),
      },
    });
  });
});
