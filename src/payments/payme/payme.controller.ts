import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { PaymeService } from './payme.service';
import { RequestBody } from './types/incoming-request-body';
import { PaymeBasicAuthGuard } from 'src/auth/guards/payme.guard';

@Controller('payme')
export class PaymeController {
  constructor(private readonly paymeService: PaymeService) {}
  @Post()
  @UseGuards(PaymeBasicAuthGuard)
  async handleTransactionMethods(@Body() reqBody: RequestBody) {
    const result = await this.paymeService.handleTransactionMethods(reqBody);
    console.log('response', result);
    return result;
  }
}
