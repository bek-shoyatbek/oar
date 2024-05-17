import { BadRequestException, Injectable } from '@nestjs/common';
import { CheckTransactionDto } from './dto/check-transaction.dto';
import { PrismaService } from 'src/prisma.service';
import { ErrorStatusCode } from './constants/error-status-codes';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { ConfigService } from '@nestjs/config';
import { ResponseStatus } from './constants/response-status';
import { ConfirmTransactionDto } from './dto/confirm-transaction.dto';
import { ReverseTransactionDto } from './dto/reverse-transaction.dto';
import { CheckTransactionStatusDto } from './dto/check-status.dto';
import { ObjectId } from 'mongodb';
import { error } from 'console';

@Injectable()
export class UzumService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {}
  async check(checkTransactionDto: CheckTransactionDto) {
    const isValidServiceId = this.checkServiceId(checkTransactionDto.serviceId);

    if (!isValidServiceId) {
      error('Invalid service id');
      throw new BadRequestException({
        serviceId: checkTransactionDto.serviceId,
        timestamp: new Date().valueOf(),
        status: ResponseStatus.Failed,
        errorCode: ErrorStatusCode.ErrorCheckingPaymentData,
      });
    }

    const isValidObjectId = ObjectId.isValid(checkTransactionDto.params.planId);

    if (!isValidObjectId) {
      error('Invalid plan id');
      throw new BadRequestException({
        serviceId: checkTransactionDto.serviceId,
        timestamp: new Date().valueOf(),
        status: ResponseStatus.Failed,
        errorCode: ErrorStatusCode.ErrorCheckingPaymentData,
      });
    }

    const plan = await this.prismaService.plans.findUnique({
      where: {
        id: checkTransactionDto.params.planId,
      },
    });

    if (!plan) {
      error('Plan not found');
      throw new BadRequestException({
        serviceId: checkTransactionDto.serviceId,
        timestamp: new Date().valueOf(),
        status: ResponseStatus.Failed,
        errorCode: ErrorStatusCode.ErrorCheckingPaymentData,
      });
    }

    return {
      serviceId: checkTransactionDto.serviceId,
      timestamp: new Date().valueOf(),
      status: ResponseStatus.Ok,
      data: {
        account: {
          value: checkTransactionDto.params.planId,
        },
      },
    };
  }

  async create(createTransactionDto: CreateTransactionDto) {
    const isValidServiceId = this.checkServiceId(
      createTransactionDto.serviceId,
    );

    if (!isValidServiceId) {
      error('Invalid service id');
      throw new BadRequestException({
        serviceId: createTransactionDto.serviceId,
        timestamp: new Date().valueOf(),
        status: ResponseStatus.Failed,
        errorCode: ErrorStatusCode.ErrorCheckingPaymentData,
      });
    }

    const isExistingTransaction =
      await this.prismaService.transactions.findUnique({
        where: {
          transId: createTransactionDto.transId,
        },
      });

    if (isExistingTransaction) {
      error('Transaction already exists');
      throw new BadRequestException({
        serviceId: createTransactionDto.serviceId,
        timestamp: new Date().valueOf(),
        status: ResponseStatus.Failed,
        errorCode: ErrorStatusCode.ErrorCheckingPaymentData,
      });
    }

    const isValidObjectId = ObjectId.isValid(
      createTransactionDto.params.planId,
    );

    if (!isValidObjectId) {
      error('Invalid account id');
      throw new BadRequestException({
        serviceId: createTransactionDto.serviceId,
        timestamp: new Date().valueOf(),
        status: ResponseStatus.Failed,
        errorCode: ErrorStatusCode.ErrorCheckingPaymentData,
      });
    }

    const plan = await this.prismaService.plans.findUnique({
      where: {
        id: createTransactionDto.params.planId,
      },
    });

    if (!plan) {
      error('Invalid plan id');
      throw new BadRequestException({
        serviceId: createTransactionDto.serviceId,
        timestamp: new Date().valueOf(),
        status: ResponseStatus.Failed,
        errorCode: ErrorStatusCode.ErrorCheckingPaymentData,
      });
    }

    const isValidAmount = plan.price === createTransactionDto.amount / 100; // ! incoming amount is in tiyn
    if (!isValidAmount) {
      error('Invalid amount');
      throw new BadRequestException({
        serviceId: createTransactionDto.serviceId,
        timestamp: new Date().valueOf(),
        status: ResponseStatus.Failed,
        errorCode: ErrorStatusCode.ErrorCheckingPaymentData,
      });
    }

    const isValidUser = await this.prismaService.users.findUnique({
      where: {
        id: createTransactionDto.params.userId,
      },
    });

    if (!isValidUser) {
      error('Invalid user id');
      throw new BadRequestException({
        serviceId: createTransactionDto.serviceId,
        timestamp: new Date().valueOf(),
        status: ResponseStatus.Failed,
        errorCode: ErrorStatusCode.ErrorCheckingPaymentData,
      });
    }

    await this.prismaService.transactions.create({
      data: {
        transId: createTransactionDto.transId,
        amount: createTransactionDto.amount,
        user: {
          connect: {
            id: createTransactionDto.params.userId,
          },
        },
        status: 'PENDING',
        provider: 'uzum',
        plan: {
          connect: {
            id: createTransactionDto.params.planId,
          },
        },
      },
    });

    return {
      serviceId: createTransactionDto.serviceId,
      timestamp: new Date().valueOf(),
      status: ResponseStatus.Created,
      transTime: new Date().valueOf(),
      transId: createTransactionDto.transId,
      amount: createTransactionDto.amount,
    };
  }

  async confirm(confirmTransactionDto: ConfirmTransactionDto) {
    const isValidServiceId = this.checkServiceId(
      confirmTransactionDto.serviceId,
    );

    if (!isValidServiceId) {
      error('Invalid service id');
      throw new BadRequestException({
        serviceId: confirmTransactionDto.serviceId,
        transId: confirmTransactionDto.transId,
        status: ResponseStatus.Failed,
        confirmTime: new Date().valueOf(),
        errorCode: ErrorStatusCode.InvalidServiceId,
      });
    }

    const transaction = await this.prismaService.transactions.findUnique({
      where: {
        transId: confirmTransactionDto.transId,
      },
    });

    const planId = transaction.planId;
    const userId = transaction.userId;

    if (!transaction) {
      error('Invalid transaction id');
      throw new BadRequestException({
        serviceId: confirmTransactionDto.serviceId,
        transId: confirmTransactionDto.transId,
        status: ResponseStatus.Failed,
        confirmTime: new Date().valueOf(),
        errorCode: ErrorStatusCode.AdditionalPaymentPropertyNotFound,
      });
    }

    if (transaction.status !== 'PENDING') {
      error('Payment already processed');
      throw new BadRequestException({
        serviceId: confirmTransactionDto.serviceId,
        transId: confirmTransactionDto.transId,
        status: ResponseStatus.Failed,
        confirmTime: new Date().valueOf(),
        errorCode: ErrorStatusCode.PaymentAlreadyProcessed,
      });
    }

    if (transaction.provider !== 'uzum') {
      error('Payment already processed');
      throw new BadRequestException({
        serviceId: confirmTransactionDto.serviceId,
        transId: confirmTransactionDto.transId,
        status: ResponseStatus.Failed,
        confirmTime: new Date().valueOf(),
        errorCode: ErrorStatusCode.PaymentAlreadyProcessed,
      });
    }

    const plan = await this.prismaService.plans.findUnique({
      where: {
        id: transaction.planId,
      },
    });

    const expirationDate = this.calculateExpirationDate(plan.availablePeriod);

    await this.prismaService.myCourses.create({
      data: {
        userId,
        courseId: plan.courseId,
        planId,
        expirationDate,
      },
    });

    await this.prismaService.transactions.update({
      where: {
        transId: confirmTransactionDto.transId,
      },
      data: {
        performTime: new Date(),
        status: 'PAID',
      },
    });

    return {
      serviceId: confirmTransactionDto.serviceId,
      transId: confirmTransactionDto.transId,
      status: ResponseStatus.Confirmed,
      confirmTime: new Date().valueOf(),
    };
  }

  async reverse(reverseTransactionDto: ReverseTransactionDto) {
    const isValidServiceId = this.checkServiceId(
      reverseTransactionDto.serviceId,
    );
    if (!isValidServiceId) {
      error('Invalid service id');
      throw new BadRequestException({
        serviceId: reverseTransactionDto.serviceId,
        transId: reverseTransactionDto.transId,
        status: ResponseStatus.Failed,
        reverseTime: new Date().valueOf(),
        errorCode: ErrorStatusCode.InvalidServiceId,
      });
    }

    const transaction = await this.prismaService.transactions.findUnique({
      where: {
        transId: reverseTransactionDto.transId,
      },
    });

    if (!transaction) {
      error('Invalid transaction id');
      throw new BadRequestException({
        serviceId: reverseTransactionDto.serviceId,
        transId: reverseTransactionDto.transId,
        status: ResponseStatus.Failed,
        reverseTime: new Date().valueOf(),
        errorCode: ErrorStatusCode.AdditionalPaymentPropertyNotFound,
      });
    }

    await this.prismaService.myCourses.delete({
      where: {
        userId: transaction.userId,
        planId: transaction.planId,
      },
    });

    await this.prismaService.transactions.update({
      where: {
        transId: reverseTransactionDto.transId,
      },
      data: {
        cancelTime: new Date(),
        status: 'CANCELED',
      },
    });
    return {
      serviceId: reverseTransactionDto.serviceId,
      transId: reverseTransactionDto.transId,
      status: ResponseStatus.Reversed,
      reverseTime: new Date().valueOf(),
      amount: transaction.amount,
    };
  }

  async status(checkTransactionDto: CheckTransactionStatusDto) {
    const isValidServiceId = this.checkServiceId(checkTransactionDto.serviceId);

    if (!isValidServiceId) {
      error('Invalid service id');
      throw new BadRequestException({
        serviceId: checkTransactionDto.serviceId,
        transId: checkTransactionDto.transId,
        status: ResponseStatus.Failed,
        errorCode: ErrorStatusCode.InvalidServiceId,
      });
    }

    const transaction = await this.prismaService.transactions.findUnique({
      where: {
        transId: checkTransactionDto.transId,
      },
    });

    if (!transaction) {
      error('Invalid transaction id');
      throw new BadRequestException({
        serviceId: checkTransactionDto.serviceId,
        transId: checkTransactionDto.transId,
        status: ResponseStatus.Failed,
        errorCode: ErrorStatusCode.AdditionalPaymentPropertyNotFound,
      });
    }

    return {
      serviceId: checkTransactionDto.serviceId,
      transId: checkTransactionDto.transId,
      status: transaction.status,
    };
  }
  private calculateExpirationDate(availablePeriod: number): Date {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + availablePeriod);
    return expirationDate;
  }

  private checkServiceId(serviceId: number) {
    const myServiceId = this.configService.get<number>('UZUM_SERVICE_ID');

    return serviceId === +myServiceId;
  }
}
