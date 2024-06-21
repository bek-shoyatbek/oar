import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { SendMailDto } from './dto/send-mail.dto';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  constructor(private readonly mailerService: MailerService) {}

  async sendMail(sendMailDto: SendMailDto) {
    const mailStatus = await this.mailerService.sendMail(sendMailDto);
    this.logger.log(sendMailDto, 'mail');
    this.logger.log(mailStatus, 'mail');
    return 'Mail sent successfully';
  }
}
