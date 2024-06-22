import { Module } from '@nestjs/common';
import { PaymeService } from './payme.service';
import { PaymeController } from './payme.controller';
import { PrismaService } from 'src/prisma.service';
import { HashingService } from 'src/utils/hashing/hashing.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { SmsService } from 'src/sms/sms.service';
import { MailService } from 'src/mail/mail.service';
import { GeneratorService } from 'src/utils/generator/generator.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [PaymeController],
  providers: [
    PaymeService,
    PrismaService,
    HashingService,
    NotificationsService,
    SmsService,
    MailService,
    GeneratorService,
  ],
})
export class PaymeModule {}
