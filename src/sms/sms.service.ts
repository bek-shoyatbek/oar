import { Injectable } from '@nestjs/common';
import { Sms } from './interfaces/sms.interface';
import { createHash } from 'node:crypto';
import {
  SendSmsErrorResponse,
  SendSmsParams,
  SendSmsResponse,
} from './interfaces/send.interface';
import { SmsStatusParams } from './interfaces/status.interface';
import { ConfigService } from '@nestjs/config';
import { GeneratorService } from 'src/utils/generator/generator.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SmsService implements Sms {
  private username: string;
  private smsURL: string;
  private smsSecret: string;

  constructor(
    private configService: ConfigService,
    private generatorService: GeneratorService,
    private readonly httpService: HttpService,
  ) {
    this.username = this.configService.get<string>('SMS_USERNAME');
    this.smsURL = this.configService.get<string>('SMS_URL');
    this.smsSecret = this.configService.get<string>('SMS_SECRET');
  }

  async sendSms(
    sendSmsParams: SendSmsParams,
  ): Promise<SendSmsResponse | SendSmsErrorResponse> {
    try {
      let uTime = new Date().valueOf() / 1000;
      const smsId = this.generatorService.generateConfirmationCode();
      const message = {
        ...sendSmsParams,
        smsid: smsId,
      };

      uTime = +uTime.toString().split('.')[0];

      const accessToken = this.md5(
        `TransmitSMS ${this.username} ${this.smsSecret} ${uTime}`,
      );
      const headersRequest = {
        'Content-Type': 'application/json',
        'X-Access-Token': accessToken,
      };

      const request = this.httpService.post(
        this.smsURL + '/TransmitSMS',
        {
          message,
          utime: uTime,
          service: {
            service: 1, // 1 - код доступа ОТП (без отчета о доставке)
          },
          username: this.username,
        },
        { headers: headersRequest },
      );

      const res = await firstValueFrom(request);

      return res.data;
    } catch (err) {
      console.log('error while sending sms', err);
      throw err;
    }
  }
  async statusSms(params: SmsStatusParams): Promise<any> {
    throw new Error('Method not implemented.');
  }

  md5(content: string, algo = 'md5') {
    const hashFunc = createHash(algo);
    hashFunc.update(content);
    return hashFunc.digest('hex');
  }
}
