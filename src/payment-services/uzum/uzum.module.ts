import { Module } from '@nestjs/common';
import { UzumService } from './uzum.service';
import { UzumController } from './uzum.controller';
import { PrismaService } from 'src/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from 'src/auth/auth.module';
import { HashingService } from 'src/utils/hashing/hashing.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { SmsService } from 'src/sms/sms.service';
import { MailService } from 'src/mail/mail.service';
import { GeneratorService } from 'src/utils/generator/generator.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [ConfigModule, AuthModule, HttpModule],
  controllers: [UzumController],
  providers: [
    UzumService,
    PrismaService,
    HashingService,
    NotificationsService,
    SmsService,
    MailService,
    GeneratorService,
  ],
})
export class UzumModule {}
