import { Injectable } from '@nestjs/common';
import { HashingService } from './utils/hashing/hashing.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor() {}
  getHello(): string {
    return 'Hello World!';
  }
}
