import { Injectable } from '@nestjs/common';
import { TransactionMethods } from './constants/transaction-methods';
import { CheckPerformTransactionDto } from './dto/check-perform-transaction.dto';
import { PrismaService } from 'src/prisma.service';
import { RequestBody } from './types/incoming-request-body';
import { GetStatementDto } from './dto/get-statement.dto';
import { CheckTransactionDto } from '../uzum/dto/check-transaction.dto';
import { CancelTransactionDto } from './dto/cancel-transaction.dto';
import { PerformTransactionDto } from './dto/perform-transaction.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { ErrorStatusCodes } from './constants/error-status-codes';

@Injectable()
export class PaymeService {
  constructor(private readonly prismaService: PrismaService) {}

  async handleTransactionMethods(reqBody: RequestBody) {
    const method = reqBody.method;
    switch (method) {
      case TransactionMethods.CheckPerformTransaction:
        return await this.checkPerformTransaction(
          reqBody as CheckPerformTransactionDto,
        );

      case TransactionMethods.CreateTransaction:
        return await this.createTransaction(reqBody as CreateTransactionDto);

      case TransactionMethods.CheckTransaction:
        return await this.checkTransaction(
          reqBody as unknown as CheckTransactionDto,
        );

      case TransactionMethods.PerformTransaction:
        return await this.performTransaction(reqBody as PerformTransactionDto);

      case TransactionMethods.CancelTransaction:
        return await this.cancelTransaction(reqBody as CancelTransactionDto);

      case TransactionMethods.GetStatement:
        return await this.getStatement(reqBody as GetStatementDto);
      default:
        return 'Invalid transaction method';
    }
  }

  /**
   * If payment is possible, the CheckPerformTransaction method returns the result allow.
   * If payment is impossible, the method returns an error.
   *
   * @param {CheckPerformTransactionDto} checkPerformTransactionDto
   */
  async checkPerformTransaction(
    checkPerformTransactionDto: CheckPerformTransactionDto,
  ) {
    const paymentId = checkPerformTransactionDto.params.account.transactionId;

    const payment = await this.prismaService.payments.findUnique({
      where: {
        id: paymentId,
      },
    });

    if (!payment) {
      const errorResponse = {
        code: ErrorStatusCodes.PayerAccountNotFound,
        message: 'Payer account not found',
        data: null,
      };
      return errorResponse;
    }

    if (payment.amount !== checkPerformTransactionDto.params.amount) {
      const errorResponse = {
        code: ErrorStatusCodes.InvalidAmount,
        message: 'Invalid amount',
        data: null,
      };
      return errorResponse;
    }
    const successResponse = {
      result: {
        allow: true,
      },
    };

    return successResponse;
  }
  /**
   * The CreateTransaction method returns a list of payment recipients.
   * When the payment originator is the recipient, the field receivers can be omitted or set to NULL.
   * If a transaction has already been created,
   * the merchant application performs basic verification of the transaction
   * and returns the verification result to Payme Business.
   *
   * @param {CreateTransactionDto} createTransactionDto
   */
  async createTransaction(createTransactionDto: CreateTransactionDto) {
    const paymentData = await this.prismaService.payments.findUnique({
      where: {
        id: createTransactionDto.params.id,
      },
    });

    if (!paymentData) {
      const errorResponse = {
        code: ErrorStatusCodes.TransactionNotFound,
        message: 'Invalid transaction',
        data: null,
      };

      return errorResponse;
    }

    if (paymentData.status === 'PAID') {
      const errorResponse = {
        code: ErrorStatusCodes.SystemError,
        message: 'Transaction already paid',
        data: null,
      };

      return errorResponse;
    }

    if (paymentData.status === 'CANCELED') {
      const errorResponse = {
        code: ErrorStatusCodes.SystemError,
        message: 'Transaction already cancelled',
        data: null,
      };

      return errorResponse;
    }

    const currentTime = Date.now();

    const expirationTime =
      (currentTime - new Date(paymentData.createdAt).getTime()) / 60000 < 12;

    if (!expirationTime) {
      const errorResponse = {
        code: ErrorStatusCodes.OperationCannotBePerformed,
        message: 'Transaction expired',
        data: null,
      };
      return errorResponse;
    }

    const successResponse = {
      result: {
        current_time: currentTime,
        transaction: paymentData.id,
        state: 1,
      },
    };

    return successResponse;
  }

  /**
   * The PerformTransaction method credits
   * funds to the merchant’s account and sets the order to “paid” status.
   *
   * @param {PerformTransactionDto} performTransactionDto
   */
  async performTransaction(performTransactionDto: PerformTransactionDto) {
    const payment = await this.prismaService.payments.findUnique({
      where: {
        id: performTransactionDto.params.id,
      },
    });

    if (!payment) {
      const errorResponse = {
        code: ErrorStatusCodes.TransactionNotFound,
        message: 'Invalid transaction',
        data: null,
      };
      return errorResponse;
    }

    if (payment.status === 'PAID') {
      const errorResponse = {
        code: ErrorStatusCodes.SystemError,
        message: 'Transaction already paid',
        data: null,
      };
      return errorResponse;
    }

    const updatedPayment = await this.prismaService.payments.update({
      where: {
        id: payment.id,
      },
      data: {
        status: 'PAID',
      },
    });

    const successResponse = {
      result: {
        transaction: updatedPayment.id,
        perform_time: new Date(updatedPayment.updatedAt).getTime(),
        state: 2,
      },
    };

    return successResponse;
  }

  /**
   * The CancelTransaction method cancels both a created and a completed transaction.
   *
   * @param {CancelTransactionDto} cancelTransactionDto
   */
  async cancelTransaction(cancelTransactionDto: CancelTransactionDto) {
    const payment = await this.prismaService.payments.findUnique({
      where: {
        id: cancelTransactionDto.params.id,
      },
    });

    if (!payment) {
      const errorResponse = {
        code: ErrorStatusCodes.TransactionNotFound,
        message: 'Invalid transaction',
        data: null,
      };
      return errorResponse;
    }

    if (payment.status === 'CANCELED') {
      const errorResponse = {
        code: ErrorStatusCodes.SystemError,
        message: 'Transaction already cancelled',
        data: null,
      };
      return errorResponse;
    }

    const updatedPayment = await this.prismaService.payments.update({
      where: {
        id: payment.id,
      },
      data: {
        status: 'CANCELED',
      },
    });

    const successResponse = {
      cancel_time: updatedPayment.updatedAt,
      transaction: payment.id,
      status: -2,
    };

    return successResponse;
  }

  /**
   * @param {CheckTransactionDto} checkTransactionDto
   */
  async checkTransaction(checkTransactionDto: CheckTransactionDto) {
    const payment = await this.prismaService.payments.findUnique({
      where: {
        id: checkTransactionDto.params.id,
      },
    });

    return {
      create_time: new Date(payment.createdAt).getTime(),
      perform_time: new Date(payment.updatedAt).getTime(),
      cancel_time: 0,
      transaction: payment.id,
      state: 2,
      reason: null,
    };
  }

  /**
   * To return a list of transactions for a specified period,
   * the GetStatement method is used
   * @param {GetStatementDto} getStatementDto
   */
  async getStatement(getStatementDto: GetStatementDto) {
    const payments = await this.prismaService.payments.findMany({
      where: {
        createdAt: {
          gte: new Date(getStatementDto.params.from),
          lte: new Date(getStatementDto.params.to),
        },
      },
    });

    const response = {
      result: {
        transactions: payments.map((payment) => {
          return {
            id: payment.id,
            time: new Date(payment.createdAt).getTime(),
            amount: payment.amount,
            account: {
              transactionId: payment.id,
            },
            create_time: new Date(payment.createdAt).getTime(),
            perform_time: new Date(payment.updatedAt).getTime(),
            cancel_time: 0,
            transaction: payment.id,
            state: 2,
            reason: null,
          };
        }),
      },
    };

    return response;
  }
}
