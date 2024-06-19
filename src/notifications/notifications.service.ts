import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  constructor() {}

  async sendMail() {
    return 'hello';
  }

  async sendSms() {
    return 'hello';
  }
  
}
