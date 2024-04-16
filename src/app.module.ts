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
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { ModulesModule } from './modules/modules.module';
import { LessonsModule } from './lessons/lessons.module';
import { GoogleDriveModule } from 'nestjs-google-drive';

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
        service: 'gmail',
        secure: false,
        auth: {
          user: process.env.MAILER_USER,
          pass: process.env.MAILER_PASSWORD,
        },
      },
      defaults: {
        from: process.env.MAILER_FROM,
      },
    }),
    CoursesModule,
    CacheModule.register({
      isGlobal: true,
    }),
    SmsModule,
    CloudinaryModule,
    ModulesModule,
    LessonsModule,
    GoogleDriveModule.register({
      clientId: process.env.GC_CLIENT_ID,
      clientSecret: process.env.GC_CLIENT_SECRET,
      redirectUrl: process.env.GC_REDIRECT_URI,
      refreshToken: process.env.GC_REFRESH_TOKEN,
    }),
  ],
  controllers: [AppController],
  providers: [AppService, GeneratorService, HashingService],
})
export class AppModule {}
