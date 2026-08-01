import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger as PinoLogger } from 'nestjs-pino';
import helmet from 'helmet';
import compression from 'compression';
import type { EnvConfig } from './config/env.validation';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(PinoLogger));

  const config = app.get(ConfigService<EnvConfig, true>);
  const nodeEnv = config.get('NODE_ENV', { infer: true });
  const appUrl = config.get('APP_URL', { infer: true });
  const port = config.get('API_PORT', { infer: true });

  app.use(
    helmet({
      contentSecurityPolicy: nodeEnv === 'production' ? undefined : false,
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(compression());

  app.enableCors({
    origin: [appUrl],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Idempotency-Key',
      'X-Api-Key',
      'X-Request-Id',
    ],
    exposedHeaders: ['X-Request-Id'],
  });

  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.set('trust proxy', 1);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.enableShutdownHooks();

  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Stellar Commerce API')
      .setDescription(
        'Payment infrastructure for the Stellar network — payments, checkout, subscriptions, ' +
          'invoicing, escrow, split payments, and treasury management.',
      )
      .setVersion('1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'session')
      .addApiKey({ type: 'apiKey', name: 'X-Api-Key', in: 'header' }, 'apiKey')
      .addTag('health', 'Liveness and readiness probes')
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`Stellar Commerce API listening on port ${port} [${nodeEnv}]`);
  if (nodeEnv !== 'production') {
    logger.log(`Swagger docs available at http://localhost:${port}/docs`);
  }
}

bootstrap().catch((error: unknown) => {
  console.error('Fatal error during bootstrap', error);
  process.exit(1);
});
