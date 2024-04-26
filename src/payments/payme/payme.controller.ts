import { Body, Controller, Post } from '@nestjs/common';
import { PaymeService } from './payme.service';

@Controller('payme')
export class PaymeController {
  constructor(private readonly paymeService: PaymeService) {}
  @Post()
  async handleTransactionMethods(@Body('method') method: string) {
    return await this.paymeService.handleTransactionMethods(method);
  }
}
