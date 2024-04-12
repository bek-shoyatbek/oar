import {
  SendSmsErrorResponse,
  SendSmsParams,
  SendSmsResponse,
} from './send.interface';
import {
  SmsStatusErrorResponse,
  SmsStatusParams,
  SmsStatusResponse,
} from './status.interface';

export interface Sms {
  sendSms(
    params: SendSmsParams,
  ): Promise<SendSmsResponse | SendSmsErrorResponse>;
  statusSms(
    params: SmsStatusParams,
  ): Promise<SmsStatusResponse | SmsStatusErrorResponse>;
}
