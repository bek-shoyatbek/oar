import { Injectable } from '@nestjs/common';
import { TransactionMethods } from './constants/transaction-methods';
import { CheckPerformTransactionDto } from './dto/check-perform-transaction.dto';
import { PrismaService } from 'src/prisma.service';
import { RequestBody } from './types/incoming-request-body';
import { GetStatementDto } from './dto/get-statement.dto';
import { CancelTransactionDto } from './dto/cancel-transaction.dto';
import { PerformTransactionDto } from './dto/perform-transaction.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { ErrorStatusCodes } from './constants/error-status-codes';
import { TransactionState } from './constants/transaction-state';
import { CheckTransactionDto } from './dto/check-transaction.dto';

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
    const planId = checkPerformTransactionDto.params?.account?.planId;

    const plain = await this.prismaService.plans.findUnique({
      where: {
        id: planId,
      },
    });

    if (!plain) {
      return {
        code: ErrorStatusCodes.PayerAccountNotFound,
        message: 'Payer account not found',
        data: null,
      };
    }

    if (plain.price !== checkPerformTransactionDto.params.amount) {
      return {
        code: ErrorStatusCodes.InvalidAmount,
        message: 'Invalid amount',
        data: null,
      };
    }
    return {
      result: {
        allow: true,
      },
    };
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
    const preciseAmount = Math.floor(createTransactionDto.params.amount / 100);

    const transaction = await this.prismaService.transactions.findUnique({
      where: {
        transId: createTransactionDto.params.id,
      },
    });

    if (transaction) {
      if (transaction.status !== 'PENDING')
        return {
          code: ErrorStatusCodes.OperationCannotBePerformed,
          message: 'Transaction already created',
          data: null,
        };
      const currentTime = Date.now();

      const expirationTime =
        (currentTime - new Date(transaction.createdAt).getTime()) / 60000 < 12;

      if (!expirationTime) {
        await this.prismaService.transactions.update({
          where: {
            transId: createTransactionDto.params.id,
          },
          data: {
            status: 'CANCELED',
          },
        });
        return {
          code: ErrorStatusCodes.OperationCannotBePerformed,
          message: 'Transaction expired',
          data: null,
        };
      }

      return {
        result: {
          current_time: currentTime,
          transaction: transaction.id,
          state: TransactionState.Pending,
        },
      };
    }

    const existingTransaction = await this.prismaService.transactions.findFirst(
      {
        where: {
          userId: createTransactionDto.params.account.user_id,
          planId: createTransactionDto.params.account.plan_id,
        },
      },
    );

    if (existingTransaction) {
      if (existingTransaction.status == 'PAID') {
        return {
          code: ErrorStatusCodes.OrderCompleted,
          message: 'Transaction already created',
          data: null,
        };
      }
      if (existingTransaction.status === 'PENDING') {
        return {
          code: ErrorStatusCodes.OperationCannotBePerformed,
          message: 'Transaction already created',
          data: null,
        };
      }
    }

    const newTransaction = await this.prismaService.transactions.create({
      data: {
        transId: createTransactionDto.params.id,
        user: {
          connect: {
            id: createTransactionDto.params.account.user_id,
          },
        },
        plan: {
          connect: {
            id: createTransactionDto.params.account.plan_id,
          },
        },
        provider: 'payme',
        amount: preciseAmount,
        status: 'PENDING',
      },
    });

    return {
      transaction: newTransaction.id,
      state: TransactionState.Pending,
      create_time: new Date(newTransaction.createdAt).getTime(),
    };
  }

  /**
   * The PerformTransaction method credits
   * funds to the merchant’s account and sets the order to “paid” status.
   *
   * @param {PerformTransactionDto} performTransactionDto
   */
  async performTransaction(performTransactionDto: PerformTransactionDto) {
    const currentTime = Date.now();

    const transaction = await this.prismaService.transactions.findUnique({
      where: {
        transId: performTransactionDto.params.id,
      },
    });

    if (!transaction) {
      return {
        code: ErrorStatusCodes.TransactionNotFound,
        message: 'Invalid transaction',
        data: null,
      };
    }

    if (transaction.status !== 'PENDING') {
      if (transaction.status !== 'PAID') {
        return {
          code: ErrorStatusCodes.OperationCannotBePerformed,
          message: 'Transaction already paid',
          data: null,
        };
      }

      return {
        perform_time: new Date(transaction.updatedAt).getTime(),
        transaction: transaction.id,
        state: TransactionState.Paid,
      };
    }

    const expirationTime =
      (currentTime - new Date(transaction.createdAt).getTime()) / 60000 < 12; // 12m

    if (!expirationTime) {
      await this.prismaService.transactions.update({
        where: {
          transId: performTransactionDto.params.id,
        },
        data: {
          status: 'CANCELED',
        },
      });
      return {
        code: ErrorStatusCodes.OperationCannotBePerformed,
        message: 'Transaction expired',
        data: null,
      };
    }

    const updatedPayment = await this.prismaService.transactions.update({
      where: {
        transId: performTransactionDto.params.id,
      },
      data: {
        status: 'PAID',
      },
    });

    return {
      result: {
        transaction: updatedPayment.id,
        perform_time: new Date(updatedPayment.updatedAt).getTime(),
        state: 2,
      },
    };
  }

  /**
   * The CancelTransaction method cancels both a created and a completed transaction.
   *
   * @param {CancelTransactionDto} cancelTransactionDto
   */
  async cancelTransaction(cancelTransactionDto: CancelTransactionDto) {
    const transaction = await this.prismaService.transactions.findUnique({
      where: {
        transId: cancelTransactionDto.params.id,
      },
    });

    if (!transaction) {
      return {
        code: ErrorStatusCodes.TransactionNotFound,
        message: 'Invalid transaction',
        data: null,
      };
    }

    if (transaction.status === 'CANCELED') {
      return {
        code: ErrorStatusCodes.SystemError,
        message: 'Transaction already cancelled',
        data: null,
      };
    }

    const updatedTransaction = await this.prismaService.transactions.update({
      where: {
        id: transaction.id,
      },
      data: {
        status: 'CANCELED',
      },
    });

    return {
      cancel_time: new Date(updatedTransaction.updatedAt).getTime(),
      transaction: updatedTransaction.id,
      status: -2,
    };
  }

  /**
   * @param {CheckTransactionDto} checkTransactionDto
   */
  async checkTransaction(checkTransactionDto: CheckTransactionDto) {
    const transaction = await this.prismaService.transactions.findUnique({
      where: {
        id: checkTransactionDto.params.id,
      },
    });

    return {
      create_time: new Date(transaction.createdAt).getTime(),
      perform_time: new Date(transaction.updatedAt).getTime(),
      cancel_time: 0,
      transaction: transaction.id,
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
    const transactions = await this.prismaService.transactions.findMany({
      where: {
        createdAt: {
          gte: new Date(getStatementDto.params.from),
          lte: new Date(getStatementDto.params.to),
        },
        provider: 'payme', // ! Transaction only from Payme
      },
    });

    return {
      result: {
        transactions: transactions.map((transaction) => {
          return {
            id: transaction.transId,
            time: new Date(transaction.createdAt).getTime(),
            amount: transaction.amount,
            account: {
              user_id: transaction.userId,
              plan_id: transaction.planId,
            },
            create_time: new Date(transaction.createdAt).getTime(),
            perform_time: new Date(transaction.updatedAt).getTime(),
            cancel_time: 0,
            transaction: transaction.id,
            state: 2,
            reason: null,
          };
        }),
      },
    };
  }
}
