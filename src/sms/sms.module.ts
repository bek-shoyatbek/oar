import { Module } from '@nestjs/common';
import { SmsService } from './sms.service';
import { GeneratorService } from 'src/utils/generator/generator.service';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    ConfigModule,
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  providers: [SmsService, GeneratorService],
})
export class SmsModule {}
