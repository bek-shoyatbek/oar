export class NotificationDto {
  provider: 'sms' | 'mail';
  contact: string;
  package: 'basic' | 'standard' | 'premium';
}
