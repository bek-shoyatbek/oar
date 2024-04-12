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
  ],
  controllers: [AppController],
  providers: [AppService, GeneratorService, HashingService],
})
export class AppModule {}
