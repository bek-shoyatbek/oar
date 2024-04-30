import { BadRequestException, Injectable } from '@nestjs/common';
import { CheckTransactionDto } from './dto/check-transaction.dto';
import { PrismaService } from 'src/prisma.service';
import { ErrorStatusCode } from './constants/error-status-codes';
import { ErrorResponseDto } from './dto/ErrorResponse.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { ConfigService } from '@nestjs/config';
import { ResponseStatus } from './constants/response-status';
import { ConfirmTransactionDto } from './dto/confirm-transaction.dto';
import { ReverseTransactionDto } from './dto/reverse-transaction.dto';
import { CheckTransactionStatusDto } from './dto/check-status.dto';
import { ObjectId } from 'mongodb';

@Injectable()
export class UzumService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {}
  async check(checkTransactionDto: CheckTransactionDto) {
    const isValidServiceId =
      this.configService.get('UZUM_SERVICE_ID') ===
      checkTransactionDto.serviceId;

    if (!isValidServiceId) {
      const errorRes = new ErrorResponseDto(
        checkTransactionDto.serviceId,
        new Date().valueOf(),
        ResponseStatus.Failed,
        ErrorStatusCode.InvalidServiceId,
      );

      throw new BadRequestException(errorRes.getResponse());
    }

    const isValidObjectId = ObjectId.isValid(
      checkTransactionDto.params.account,
    );

    if (!isValidObjectId) {
      const errorRes = new ErrorResponseDto(
        checkTransactionDto.serviceId,
        new Date().valueOf(),
        ResponseStatus.Failed,
        ErrorStatusCode.ErrorCheckingPaymentData,
      );

      throw new BadRequestException(errorRes.getResponse());
    }

    const isValidPayment = await this.prismaService.payments.findUnique({
      where: {
        id: checkTransactionDto.params.account,
      },
    });

    if (!isValidPayment) {
      const errorRes = new ErrorResponseDto(
        checkTransactionDto.serviceId,
        new Date().valueOf(),
        ResponseStatus.Failed,
        ErrorStatusCode.ErrorCheckingPaymentData,
      );

      throw new BadRequestException(errorRes.getResponse());
    }

    const successResponse = {
      serviceId: checkTransactionDto.serviceId,
      timestamp: new Date().valueOf(),
      status: ResponseStatus.Ok,
      params: {
        account: checkTransactionDto.params.account,
      },
    };

    return successResponse;
  }

  async create(createTransactionDto: CreateTransactionDto) {
    const isValidServiceId = this.checkServiceId(
      createTransactionDto.serviceId,
    );

    if (!isValidServiceId) {
      const errorRes = new ErrorResponseDto(
        createTransactionDto.serviceId,
        new Date().valueOf(),
        ResponseStatus.Failed,
        ErrorStatusCode.InvalidServiceId,
      );

      throw new BadRequestException(errorRes.getResponse());
    }

    const isExistingTransactionId =
      await this.prismaService.payments.findUnique({
        where: {
          transId: createTransactionDto.transId,
        },
      });

    if (isExistingTransactionId) {
      const errorRes = new ErrorResponseDto(
        createTransactionDto.serviceId,
        new Date().valueOf(),
        ResponseStatus.Failed,
        ErrorStatusCode.ErrorCheckingPaymentData,
      );
      throw new BadRequestException(errorRes.getResponse());
    }

    const isValidObjectId = ObjectId.isValid(
      createTransactionDto.params.account,
    );

    if (!isValidObjectId) {
      const errorRes = new ErrorResponseDto(
        createTransactionDto.serviceId,
        new Date().valueOf(),
        ResponseStatus.Failed,
        ErrorStatusCode.ErrorCheckingPaymentData,
      );

      throw new BadRequestException(errorRes.getResponse());
    }

    const isValidPaymentData = await this.prismaService.payments.findUnique({
      where: {
        id: createTransactionDto.params.account,
      },
    });

    if (!isValidPaymentData) {
      const errorRes = new ErrorResponseDto(
        createTransactionDto.serviceId,
        new Date().valueOf(),
        ResponseStatus.Failed,
        ErrorStatusCode.ErrorCheckingPaymentData,
      );
      throw new BadRequestException(errorRes.getResponse());
    }

    // update payment status to created
    await this.prismaService.payments.update({
      where: {
        id: createTransactionDto.params.account,
      },
      data: {
        status: 'PENDING',
        transId: createTransactionDto.transId,
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
      throw new BadRequestException({
        serviceId: confirmTransactionDto.serviceId,
        transId: confirmTransactionDto.transId,
        status: ResponseStatus.Failed,
        confirmTime: new Date().valueOf(),
        errorCode: ErrorStatusCode.InvalidServiceId,
      });
    }

    const isValidPaymentData = await this.prismaService.payments.findUnique({
      where: {
        transId: confirmTransactionDto.transId,
      },
    });

    if (!isValidPaymentData) {
      throw new BadRequestException({
        serviceId: confirmTransactionDto.serviceId,
        transId: confirmTransactionDto.transId,
        status: ResponseStatus.Failed,
        confirmTime: new Date().valueOf(),
        errorCode: ErrorStatusCode.AdditionalPaymentPropertyNotFound,
      });
    }

    await this.prismaService.payments.update({
      where: {
        transId: confirmTransactionDto.transId,
      },
      data: {
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
      throw new BadRequestException({
        serviceId: reverseTransactionDto.serviceId,
        transId: reverseTransactionDto.transId,
        status: ResponseStatus.Failed,
        reverseTime: new Date().valueOf(),
        errorCode: ErrorStatusCode.InvalidServiceId,
      });
    }
    const isValidPaymentData = await this.prismaService.payments.findUnique({
      where: {
        transId: reverseTransactionDto.transId,
      },
    });
    if (!isValidPaymentData) {
      throw new BadRequestException({
        serviceId: reverseTransactionDto.serviceId,
        transId: reverseTransactionDto.transId,
        status: ResponseStatus.Failed,
        reverseTime: new Date().valueOf(),
        errorCode: ErrorStatusCode.AdditionalPaymentPropertyNotFound,
      });
    }
    await this.prismaService.payments.update({
      where: {
        transId: reverseTransactionDto.transId,
      },
      data: {
        status: 'CANCELED',
      },
    });
    return {
      serviceId: reverseTransactionDto.serviceId,
      transId: reverseTransactionDto.transId,
      status: ResponseStatus.Reversed,
      reverseTime: new Date().valueOf(),
      amount: isValidPaymentData.amount,
    };
  }

  async status(checkTransactionDto: CheckTransactionStatusDto) {
    const isValidServiceId = this.checkServiceId(checkTransactionDto.serviceId);

    if (!isValidServiceId) {
      throw new BadRequestException({
        serviceId: checkTransactionDto.serviceId,
        transId: checkTransactionDto.transId,
        status: ResponseStatus.Failed,
        errorCode: ErrorStatusCode.InvalidServiceId,
      });
    }

    const isValidPaymentData = await this.prismaService.payments.findUnique({
      where: {
        transId: checkTransactionDto.transId,
      },
    });
    if (!isValidPaymentData) {
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
      status: isValidPaymentData.status,
    };
  }

  private checkServiceId(serviceId: number) {
    return this.configService.get('UZUM_SERVICE_ID') === serviceId;
  }
}
