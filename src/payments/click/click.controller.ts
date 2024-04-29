import { Body, Controller, Post } from '@nestjs/common';
import { ClickService } from './click.service';
import { ClickRequestDto } from './dto/request.dto';

@Controller('click')
export class ClickController {
  constructor(private readonly clickService: ClickService) {}
  @Post('merchant')
  async handleMerchantTransactions(@Body() clickReqBody: ClickRequestDto) {
    return this.clickService.handleMerchantTransactions(clickReqBody);
  }
}
