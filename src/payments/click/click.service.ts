import { Injectable } from '@nestjs/common';
import { ClickRequestDto } from './dto/request.dto';

@Injectable()
export class ClickService {
  constructor() {}

  async handleMerchantTransactions(clickReqBody: ClickRequestDto) {
    console.log('body', clickReqBody);
    return 'success';
  }
}
