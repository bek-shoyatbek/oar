import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { MailModule } from 'src/mail/mail.module';
import { SmsModule } from 'src/sms/sms.module';

@Module({
  imports: [MailModule, SmsModule],
  providers: [NotificationsService],
})
export class NotificationsModule {}
