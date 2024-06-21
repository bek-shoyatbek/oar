import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as process from 'node:process';
import * as morgan from 'morgan';
import { WinstonModule } from 'nest-winston';
import { loggerConfig } from './configs/logger.config';
import { Logger } from '@nestjs/common';

const port = process.env.PORT || 3000;

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger(loggerConfig),
  });

  app.setGlobalPrefix('api/v1');

  app.use(morgan('dev'));

  app.enableCors({
    origin: '*',
  });

  await app.listen(port);
}

bootstrap().then(() =>
  Logger.log(`Server started on port ${port}`, 'NestApplication'),
);
