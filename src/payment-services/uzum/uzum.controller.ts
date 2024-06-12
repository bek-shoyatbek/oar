import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UzumService } from './uzum.service';
import { CheckTransactionDto } from './dto/check-transaction.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { ConfirmTransactionDto } from './dto/confirm-transaction.dto';
import { ReverseTransactionDto } from './dto/reverse-transaction.dto';
import { CheckTransactionStatusDto } from './dto/check-status.dto';
import { UzumBasicAuthGuard } from 'src/auth/guards/uzum.guard';
import { Public } from 'src/decorators/public.decorator';

@Controller('uzum')
export class UzumController {
  constructor(private readonly uzumService: UzumService) {}

  @Post('check')
  @Public()
  @UseGuards(UzumBasicAuthGuard)
  @HttpCode(HttpStatus.OK)
  async check(@Body() checkTransactionDto: CheckTransactionDto) {
    console.log('uzumReqBody:', checkTransactionDto);
    const response = await this.uzumService.check(checkTransactionDto);
    console.log('response', response);

    return response;
  }

  @Post('create')
  @Public()
  @UseGuards(UzumBasicAuthGuard)
  @HttpCode(HttpStatus.OK)
  async create(@Body() createTransactionDto: CreateTransactionDto) {
    console.log('uzumReqBody:', createTransactionDto);
    const response = await this.uzumService.create(createTransactionDto);
    console.log('response', response);

    return response;
  }

  @Post('confirm')
  @Public()
  @UseGuards(UzumBasicAuthGuard)
  @HttpCode(HttpStatus.OK)
  async confirm(@Body() confirmTransactionDto: ConfirmTransactionDto) {
    console.log('uzumReqBody:', confirmTransactionDto);
    const response = await this.uzumService.confirm(confirmTransactionDto);
    console.log('response', response);

    return response;
  }

  @Post('reverse')
  @Public()
  @UseGuards(UzumBasicAuthGuard)
  @HttpCode(HttpStatus.OK)
  async reverse(@Body() reverseTransactionDto: ReverseTransactionDto) {
    console.log('uzumReqBody:', reverseTransactionDto);
    const response = await this.uzumService.reverse(reverseTransactionDto);
    console.log('response', response);

    return response;
  }

  @Post('status')
  @Public()
  @UseGuards(UzumBasicAuthGuard)
  @HttpCode(HttpStatus.OK)
  async status(@Body() checkTransactionStatusDto: CheckTransactionStatusDto) {
    console.log('uzumReqBody:', checkTransactionStatusDto);
    const response = await this.uzumService.status(checkTransactionStatusDto);
    console.log('response', response);
    return response;
  }
}
