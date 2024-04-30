import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as process from 'node:process';
import * as morgan from 'morgan';
import { createHash } from 'node:crypto';

const port = process.env.PORT || 3000;

const mySecret = '7mPCX0zGrVim';

const reqBody = {
  click_trans_id: '2574941435',
  service_id: '33448',
  click_paydoc_id: '3221017641',
  merchant_trans_id: '663090ed30dc1a35a1c2dfec',
  amount: '1000',
  action: '0',
  sign_time: '2024-04-30 13:45:04',
  error: '0',
  error_note: 'Success',
  sign_string: '1e49357a6e30e8c0f8656aaa74efcc99',
};

async function bootstrap() {
  console.log(
    'md5',
    reqBody.sign_string ==
      md5(
        `${reqBody.click_trans_id}${reqBody.service_id}${mySecret}${reqBody.merchant_trans_id}${reqBody.amount}${reqBody.action}${reqBody.sign_time}`,
      ),
  );
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  app.use(morgan('dev'));

  app.enableCors({
    origin: '*',
  });

  await app.listen(port);
}

bootstrap().then(() => console.log('Server started on port ' + port));

function md5(content: string, algo = 'md5') {
  const hashFunc = createHash(algo);
  hashFunc.update(content);
  return hashFunc.digest('hex');
}
