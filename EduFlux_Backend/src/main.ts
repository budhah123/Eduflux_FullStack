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

async function bootstrap() {
  const port = process.env.APP_PORT || 8080;

  const app = await NestFactory.create(AppModule);

  // Serve static files
  app.use(express.static(join(__dirname, '..', 'public')));

  // Extending req size
  app.use(express.json({ limit: '10mb' }));

  // Basic Auth for API Documentation (must be before Swagger setup)
  app.use(
    ['/admin/docs', '/docs'],
    basicAuth({
      challenge: true,
      users: { budhah: 'Budhah@456' }, // TODO: Change to env variables
    }),
  );

  // Setup Swagger
  SwaggerService.setup(app);

  // Enable compression
  app.use(compression());

  //cors config
  app.enableCors();
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
