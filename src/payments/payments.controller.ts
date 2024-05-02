import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { Prisma } from '@prisma/client';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create')
  async create(@Body() createPaymentDto: Prisma.TransactionsCreateInput) {
    return await this.paymentsService.create(createPaymentDto);
  }

  @Get('all')
  async getAll(@Query() query: Prisma.TransactionsFindManyArgs) {
    return await this.paymentsService.getAll(query);
  }

  @Get('single/:id')
  async check(@Query('id') id: string) {
    return await this.paymentsService.check(id);
  }
}
