import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ClickService } from './click.service';
import { ClickRequestDto } from './dto/click-request.dto';
import { Public } from 'src/decorators/public.decorator';

@Controller('click')
export class ClickController {
  constructor(private readonly clickService: ClickService) {}
  @Post('shop-api')
  @Public()
  @HttpCode(HttpStatus.OK)
  async handleMerchantTransactions(@Body() clickReqBody: ClickRequestDto) {
    console.log('clickReqBody', clickReqBody);
    const response =
      await this.clickService.handleMerchantTransactions(clickReqBody);
    console.log('response', response);
    return response;
  }
}
