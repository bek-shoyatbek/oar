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
import { Public } from 'src/decorators/public.decorator';

@Controller('payme')
export class PaymeController {
  constructor(private readonly paymeService: PaymeService) {}

  @Post()
  @Public()
  @UseGuards(PaymeBasicAuthGuard)
  @HttpCode(HttpStatus.OK)
  async handleTransactionMethods(@Body() reqBody: RequestBody) {
    console.log('payme reqBody', reqBody);
    const response = await this.paymeService.handleTransactionMethods(reqBody);
    console.log('response', response);
    return response;
  }
}
