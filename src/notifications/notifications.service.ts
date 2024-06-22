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
        return 'sms sent';
      case 'mail':
        const sendMailParams = {
          to: notificationDto.contact,
          subject:
            'Приветственное письмо участникам курса «Прикорм без проблем» --- Поздравляем! Оплата за курс «Прикорм без проблем» прошла успешно! ',
          text: MESSAGES.mail[notificationDto.package],
        };
        await this.mailService.sendMail(sendMailParams);
        return 'mail sent';
      default:
        throw new Error('Unknown notification type');
    }
  }
}
