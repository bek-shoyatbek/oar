import { Module } from '@nestjs/common';
import { ClickService } from './click.service';
import { ClickController } from './click.controller';
import { PrismaService } from 'src/prisma.service';
import { HashingService } from 'src/utils/hashing/hashing.service';
import { ConfigModule } from '@nestjs/config';
import { NotificationsService } from 'src/notifications/notifications.service';
import { SmsService } from 'src/sms/sms.service';
import { MailService } from 'src/mail/mail.service';
import { GeneratorService } from 'src/utils/generator/generator.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [ConfigModule, HttpModule],
  controllers: [ClickController],
  providers: [
    ClickService,
    PrismaService,
    HashingService,
    NotificationsService,
    SmsService,
    MailService,
    GeneratorService,
  ],
})
export class ClickModule {}
