import { Injectable } from '@nestjs/common';
import { CONFIRMATION_MESSAGE } from '../../constants/confirmation-message.mail';
import { v4 as uuidv4 } from 'uuid';


@Injectable()
export class GeneratorService {
  generateUUID(): string {
    return uuidv4();
  }

  generateConfirmationCode(): number {
    return Math.floor(100000 + Math.random() * 900000); // 5 numbers
  }

  generateConfirmationMessage(code: number): string {
    return CONFIRMATION_MESSAGE(code);
  }
}
