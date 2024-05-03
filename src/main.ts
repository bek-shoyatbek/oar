import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as process from 'node:process';
import * as morgan from 'morgan';
import { PrismaClientExceptionFilter } from './exception-filters/prisma/prisma.filter';

const port = process.env.PORT || 3000;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const { httpAdapter } = app.get(HttpAdapterHost);

  app.setGlobalPrefix('api/v1');

  app.use(morgan('dev'));

  app.enableCors({
    origin: '*',
  });

  app.useGlobalFilters(new PrismaClientExceptionFilter(httpAdapter));

  await app.listen(port);
}

bootstrap().then(() => console.log('Server started on port ' + port));
