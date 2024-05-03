import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PaymeService } from './payme.service';
import { RequestBody } from './types/incoming-request-body';
import { PaymeBasicAuthGuard } from 'src/auth/guards/payme.guard';
import { log } from 'console';

@Controller('payme')
export class PaymeController {
  constructor(private readonly paymeService: PaymeService) {}
  @Post()
  @UseGuards(PaymeBasicAuthGuard)
  @HttpCode(HttpStatus.OK)
  async handleTransactionMethods(@Body() reqBody: RequestBody) {
    log('payme:reqBody', reqBody);
    const result = await this.paymeService.handleTransactionMethods(reqBody);
    console.log('response', result);
    return result;
  }
}
