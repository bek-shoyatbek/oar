import { Injectable } from '@nestjs/common';
import { Sms } from './interfaces/sms.interface';
import { SendSmsParams } from './interfaces/send.interface';
import { SmsStatusParams } from './interfaces/status.interface';

@Injectable()
export class SmsService implements Sms {
  constructor() {}

  async sendSms(params: SendSmsParams): Promise<any> {
    throw new Error('Method not implemented.');
  }
  async statusSms(params: SmsStatusParams): Promise<any> {
    throw new Error('Method not implemented.');
  }
}
