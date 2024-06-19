import { Injectable } from '@nestjs/common';
import { MailService } from 'src/mail/mail.service';
import { SmsService } from 'src/sms/sms.service';
import { NotificationDto } from './dto/notification.dto';
import { MESSAGES } from './constants/messages';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly smsService: SmsService,
    private readonly mailService: MailService,
  ) {}

  async sendNotification(notificationDto: NotificationDto) {
    const via = notificationDto.provider;
    switch (via) {
      case 'sms':
        const sendSMSParams = {
          phone: notificationDto.contact,
          text: MESSAGES.sms[notificationDto.package],
        };
        await this.smsService.sendSms(sendSMSParams);
        break;
      case 'mail':
        const sendMailParams = {
          to: notificationDto.contact,
          subject: MESSAGES.mail[notificationDto.package],
          text: MESSAGES.mail[notificationDto.package],
        };
        await this.mailService.sendMail(sendMailParams);
        break;
      default:
        throw new Error('Unknown notification type');
    }
  }
}
