import { Injectable, Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(SmsService.name);
  private username: string;
  private smsURL: string;
  private smsSecret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly generatorService: GeneratorService,
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
      if (!sendSmsParams.phone) {
        this.logger.error('Phone is required', 'sms');
        throw new Error();
      }
      if (!sendSmsParams.text) {
        this.logger.error("Text can't be empty", 'sms');
        throw new Error();
      }

      this.logger.log(sendSmsParams, 'sms');

      let uTime = new Date().valueOf() / 1000;
      const smsId = this.generatorService.generateConfirmationCode();
      const message = {
        ...sendSmsParams,
        smsid: smsId,
      };

      const utime = +uTime.toString().split('.')[0];

      const accessToken = this.md5(
        `TransmitSMS ${this.username} ${this.smsSecret} ${utime}`,
      );
      const headersRequest = {
        'Content-Type': 'application/json',
        'X-Access-Token': accessToken,
      };

      const request = this.httpService.post(
        this.smsURL + '/TransmitSMS',
        {
          message,
          utime: utime,
          service: {
            service: 1, // 1 - код доступа ОТП (без отчета о доставке)
          },
          username: this.username,
        },
        { headers: headersRequest },
      );

      const res = await firstValueFrom(request);

      if (res.data.error) {
        this.logger.error(res.data.error, 'sms');
        throw new Error(res.data.error);
      }

      this.logger.log(res.data, 'sms');

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
