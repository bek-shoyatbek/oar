import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { SmsService } from 'src/sms/sms.service';
import { MailService } from 'src/mail/mail.service';
import { MailModule } from 'src/mail/mail.module';
import { SmsModule } from 'src/sms/sms.module';
import { GeneratorService } from 'src/utils/generator/generator.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [MailModule, SmsModule, HttpModule],
  providers: [NotificationsService, SmsService, MailService, GeneratorService],
})
export class NotificationsModule {}
