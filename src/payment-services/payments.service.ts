import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createPaymentDto: Prisma.TransactionsCreateInput) {
    return await this.prismaService.transactions.create({
      data: createPaymentDto,
    });
  }

  async getAll(query: Prisma.TransactionsFindManyArgs) {
    return await this.prismaService.transactions.findMany(query);
  }

  async check(id: string) {
    const payment = await this.prismaService.transactions.findUnique({
      where: { id },
    });
    if (!payment) {
      throw new BadRequestException('Payment not found');
    }
    return payment;
  }
}
