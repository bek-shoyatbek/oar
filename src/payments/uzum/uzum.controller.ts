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

@Controller('uzum')
export class UzumController {
  constructor(private readonly uzumService: UzumService) {}

  @UseGuards(UzumBasicAuthGuard)
  @Post('check')
  @HttpCode(HttpStatus.OK)
  async check(@Body() checkTransactionDto: CheckTransactionDto) {
    return await this.uzumService.check(checkTransactionDto);
  }

  @UseGuards(UzumBasicAuthGuard)
  @Post('create')
  @HttpCode(HttpStatus.OK)
  async create(@Body() createTransactionDto: CreateTransactionDto) {
    return await this.uzumService.create(createTransactionDto);
  }

  @UseGuards(UzumBasicAuthGuard)
  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  async confirm(@Body() confirmTransactionDto: ConfirmTransactionDto) {
    return await this.uzumService.confirm(confirmTransactionDto);
  }

  @UseGuards(UzumBasicAuthGuard)
  @Post('reverse')
  @HttpCode(HttpStatus.OK)
  async reverse(@Body() reverseTransactionDto: ReverseTransactionDto) {
    return await this.uzumService.reverse(reverseTransactionDto);
  }

  @UseGuards(UzumBasicAuthGuard)
  @Post('status')
  @HttpCode(HttpStatus.OK)
  async status(@Body() checkTransactionStatusDto: CheckTransactionStatusDto) {
    return await this.uzumService.status(checkTransactionStatusDto);
  }
}
