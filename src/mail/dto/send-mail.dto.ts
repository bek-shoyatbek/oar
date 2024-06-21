export class SendMailDto {
  to: string;
  subject: string;
  from?: string;
  text?: string;
  html?: string;
}
