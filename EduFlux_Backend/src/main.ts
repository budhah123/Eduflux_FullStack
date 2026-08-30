import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
dotenv.config();
import { webcrypto } from 'node:crypto';
// Polyfill Web Crypto only when missing (older Node versions).
if (!globalThis.crypto) {
  (globalThis as any).crypto = webcrypto;
}
// import * as graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.js';
import { ValidationPipe } from '@nestjs/common';
import compression from 'compression';
import { SwaggerService } from '@app/swagger';
import express from 'express';
import { join } from 'path';
import basicAuth from 'express-basic-auth';
import helmet from 'helmet';

async function bootstrap() {
  const port = process.env.APP_PORT || 8080;
  const corsOrigins = new Set([
    ...(process.env.FRONTEND_URL ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
  ]);

  const isAllowedOrigin = (origin?: string) => {
    if (!origin) return true;
    if (corsOrigins.has(origin)) return true;
    return /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
  };

  const swaggerUser = process.env.SWAGGER_USER ?? 'admin';
  const swaggerPassword =
    process.env.SWAGGER_PASSWORD ?? 'ChangeMe-Strong-Password';

  const app = await NestFactory.create(AppModule);

  app.use(helmet());

  // Serve static files
  app.use(express.static(join(__dirname, '..', 'public')));

  // Extending req size
  app.use(express.json({ limit: '10mb' }));

  // Basic Auth for API Documentation (must be before Swagger setup)
  app.use(
    ['/admin/docs', '/docs'],
    basicAuth({
      challenge: true,
      users: { [swaggerUser]: swaggerPassword },
    }),
  );

  // Setup Swagger
  SwaggerService.setup(app);

  // Enable compression
  app.use(compression());

  app.enableCors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // app.use(graphqlUploadExpress({ maxFileSize: 50000000, maxFiles: 10 })); // Will be used for graphql

  await app.listen(port, () =>
    console.info(
      `\n=================================================================\n
            'App started at 
            URL:['${port}'] - ENV: [${process.env.APP_ENV}]
            Regular API Documentation: /docs
            Admin API Documentation: /admin/docs
      \n=================================================================`,
    ),
  );

  console.log(`App running at ${process.env.APP_HOST}:${process.env.APP_PORT}`);
}
bootstrap();
// test
