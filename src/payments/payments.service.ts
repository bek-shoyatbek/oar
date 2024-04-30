import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createPaymentDto: Prisma.PaymentsCreateInput) {
    return await this.prismaService.payments.create({ data: createPaymentDto });
  }

  async getAll(query: Prisma.PaymentsFindManyArgs) {
    return await this.prismaService.payments.findMany(query);
  }

  async check(id: string) {
    const payment = await this.prismaService.payments.findUnique({
      where: { id },
    });
    if (!payment) {
      throw new BadRequestException('Payment not found');
    }
    return payment;
  }
}
