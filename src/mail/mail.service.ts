import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { SendMailDto } from './dto/send-mail.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async sendMail(sendMailDto: SendMailDto) {
    sendMailDto.from = 'hello.academiaroditeley@gmail.com';
    await this.mailerService.sendMail(sendMailDto);
    return 'Mail sent successfully';
  }
}
