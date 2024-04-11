import { Injectable } from '@nestjs/common';
import {
  CONFIRMATION_MESSAGE_EMAIL,
  CONFIRMATION_MESSAGE_PHONE,
} from '../../constants/confirmation-message.mail';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class GeneratorService {
  generateUUID(): string {
    return uuidv4();
  }

  generateConfirmationCode(): number {
    return Math.floor(10000 + Math.random() * 90000); // 5 numbers
  }

  generateConfirmationMessage(
    code: number,
    service: 'email' | 'phone',
  ): string {
    return service === 'phone'
      ? CONFIRMATION_MESSAGE_PHONE(code)
      : CONFIRMATION_MESSAGE_EMAIL(code);
  }
}
