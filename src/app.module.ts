import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { CoursesModule } from './courses/courses.module';
import { CacheModule } from '@nestjs/cache-manager';
import { GeneratorService } from './utils/generator/generator.service';
import { PassportModule } from '@nestjs/passport';
import { HashingService } from './utils/hashing/hashing.service';
import { SmsModule } from './sms/sms.module';
import { ModulesModule } from './course-modules/modules.module';
import { LessonsModule } from './lessons/lessons.module';
import { S3Module } from './aws/s3/s3.module';
import { PaymeModule } from './payment-services/payme/payme.module';
import { ClickModule } from './payment-services/click-up/click.module';
import { UzumModule } from './payment-services/uzum/uzum.module';
import { ArticlesModule } from './articles/articles.module';
import { PaymentsModule } from './payment-services/payments.module';
import { BannersModule } from './banners/banners.module';
import { CommentsModule } from './comments/comments.module';
import { PlansModule } from './plans/plans.module';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth/guards/auth.guard';
import { StaticsModule } from './statics/statics.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    UsersModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    MailModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    MailerModule.forRoot({
      transport: {
        host: process.env.MAIL_SERVER,
        port: Number(process.env.MAIL_PORT),
        secure: false,
        auth: {
          user: process.env.MAIL_LOGIN,
          pass: process.env.MAIL_PWD,
        },
      },
      defaults: {
        from: process.env.MAIL_FROM,
      },
    }),
    CoursesModule,
    CacheModule.register({
      isGlobal: true,
    }),
    SmsModule,
    ModulesModule,
    LessonsModule,
    S3Module,
    PaymeModule,
    ClickModule,
    UzumModule,
    ArticlesModule,
    PaymentsModule,
    BannersModule,
    CommentsModule,
    PlansModule,
    StaticsModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    GeneratorService,
    HashingService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
