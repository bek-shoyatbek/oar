import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as process from 'node:process';
import * as morgan from 'morgan';

const port = process.env.PORT || 3000;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1')

  app.use(morgan('dev'));

  app.enableCors({
    origin: '*',
  });

  await app.listen(port);

}

bootstrap().then(r => console.log('Server started on port ' + port));
