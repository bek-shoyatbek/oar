import { Body, Controller, Post } from '@nestjs/common';
import { PaymeService } from './payme.service';
import { RequestBody } from './types/incoming-request-body';

@Controller('payme')
export class PaymeController {
  constructor(private readonly paymeService: PaymeService) {}
  @Post()
  async handleTransactionMethods(@Body() reqBody: RequestBody) {
    const result = await this.paymeService.handleTransactionMethods(reqBody);
    console.log('response', result);
    return result;
  }
}
