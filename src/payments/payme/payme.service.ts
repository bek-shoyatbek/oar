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
import { log } from 'console';

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

    const userId = checkPerformTransactionDto.params?.account?.user_id;

    const plan = await this.prismaService.plans.findUnique({
      where: {
        id: planId,
      },
    });

    const user = await this.prismaService.users.findUnique({
      where: {
        id: userId,
      },
    });

    if (!plan || !user) {
      return {
        error: {
          code: ErrorStatusCodes.TransactionNotAllowed,
          message: {
            uz: 'Sizda mahsulot/foydalanuvchi topilmadi',
            en: 'Product/user not found',
            ru: 'Товар/пользователь не найден',
          },
          data: null,
        },
      };
    }

    if (plan.price !== checkPerformTransactionDto.params.amount) {
      return {
        error: {
          code: ErrorStatusCodes.InvalidAmount,
          message: {
            uz: 'Noto`g`ri summa',
            en: 'Invalid amount',
            ru: 'Недопустимая сумма',
          },
          data: null,
        },
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
    const planId = createTransactionDto.params?.account?.planId;

    const userId = createTransactionDto.params?.account?.user_id;

    const plan = await this.prismaService.plans.findUnique({
      where: {
        id: planId,
      },
    });

    const user = await this.prismaService.users.findUnique({
      where: {
        id: userId,
      },
    });

    if (!plan || !user) {
      return {
        error: {
          code: ErrorStatusCodes.TransactionNotAllowed,
          message: {
            uz: 'Sizda mahsulot/foydalanuvchi topilmadi',
            en: 'Product/user not found',
            ru: 'Товар/пользователь не найден',
          },
          data: null,
        },
      };
    }

    const transaction = await this.prismaService.transactions.findUnique({
      where: {
        transId: createTransactionDto.params.id,
      },
    });

    if (transaction) {
      return {
        error: {
          code: ErrorStatusCodes.TransactionNotAllowed,
          message: {
            uz: 'Transaksiya band qilingan',
            en: 'Transaction already created',
            ru: 'Транзакция уже создана',
          },
          data: null,
        },
      };
    }

    if (plan.price !== createTransactionDto.params.amount) {
      return {
        error: {
          code: ErrorStatusCodes.InvalidAmount,
          message: {
            uz: 'Transaksiya miqdori hato',
            en: 'Transaction amount is wrong',
            ru: 'Сумма транзакции неверна',
          },
          data: null,
        },
      };
    }

    const existingTransaction = await this.prismaService.transactions.findFirst(
      {
        where: {
          userId: createTransactionDto.params.account.user_id,
          planId: createTransactionDto.params.account.planId,
        },
      },
    );

    if (existingTransaction?.status == 'PAID') {
      return {
        error: {
          code: ErrorStatusCodes.TransactionNotAllowed,
          message: {
            uz: 'Buyurtma allaqachon bajarildi',
            en: 'Order already completed',
            ru: 'Заказ уже завершен',
          },
          data: null,
        },
      };
    }

    if(existingTransaction?.status == 'CANCELED') {
      return {
        error: {
          code: ErrorStatusCodes.TransactionNotAllowed,
          message: {
            uz: 'Buyurtma allaqachon bajarildi',
            en: 'Order already completed',
            ru: 'Заказ уже завершен',
          },
          data: null,
        },
      };
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
            id: createTransactionDto.params.account.planId,
          },
        },
        provider: 'payme',
        amount: createTransactionDto.params.amount,
      },
    });

    return {
      result: {
        transaction: newTransaction.id,
        state: TransactionState.Pending,
        create_time: new Date(newTransaction.createdAt).getTime(),
      },
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
        error: {
          code: ErrorStatusCodes.TransactionNotFound,
          message: {
            uz: 'Transaksiya topilmadi',
            en: 'Transaction not found',
            ru: 'Транзакция не найдена',
          },
          data: null,
        },
      };
    }

    if (transaction.status === 'PAID') {
      return {
        error: {
          code: ErrorStatusCodes.TransactionNotAllowed,
          message: {
            uz: 'Transaksiya allaqachon bajarildi',
            en: 'Transaction already completed',
            ru: 'Транзакция уже завершена',
          },
          data: null,
        },
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
        error: {
          code: ErrorStatusCodes.OperationCannotBePerformed,
          message: {
            uz: 'Transaksiyani amal qilishga ruxsat berilmadi',
            en: 'Transaction cannot be performed',
            ru: 'Транзакция не может быть выполнена',
          },
          data: null,
        },
      };
    }

    const plan = await this.prismaService.plans.findUnique({
      where: {
        id: transaction.planId,
      },
    });

    await this.prismaService.myCourses.create({
      data: {
        user: {
          connect: {
            id: transaction.userId,
          },
        },
        plan: {
          connect: {
            id: transaction.planId,
          },
        },
        courseId: plan.courseId,
      },
    });

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
        error: {
          code: ErrorStatusCodes.TransactionNotFound,
          message: {
            uz: 'Transaksiya topilmadi',
            en: 'Transaction not found',
            ru: 'Транзакция не найдена',
          },
          data: null,
        },
      };
    }

    if (transaction.status === 'CANCELED') {
      return {
        error: {
          code: ErrorStatusCodes.TransactionNotAllowed,
          message: {
            uz: 'Transaksiya bekor qilingan',
            en: 'Transaction canceled',
            ru: 'Транзакция отменена',
          },
          data: null,
        },
      };
    }

    await this.prismaService.myCourses.delete({
      where: {
        userId: transaction.userId,
      },
    });

    const updatedTransaction = await this.prismaService.transactions.update({
      where: {
        id: transaction.id,
      },
      data: {
        status: 'CANCELED',
      },
    });

    return {
      result: {
        cancel_time: new Date(updatedTransaction.updatedAt).getTime(),
        transaction: updatedTransaction.id,
        status: -2,
      },
    };
  }

  /**
   * @param {CheckTransactionDto} checkTransactionDto
   */
  async checkTransaction(checkTransactionDto: CheckTransactionDto) {
    const transaction = await this.prismaService.transactions.findUnique({
      where: {
        transId: checkTransactionDto.params.id,
      },
    });

    if (!transaction) {
      return {
        error: {
          code: ErrorStatusCodes.TransactionNotAllowed,
          message: {
            uz: 'Transaksiya topilmadi',
            en: 'Transaction not found',
            ru: 'Транзакция не найдена',
          },
          data: null,
        },
      };
    }

    return {
      result: {
        create_time: new Date(transaction.createdAt).getTime(),
        perform_time: new Date(transaction.updatedAt).getTime(),
        cancel_time: 0,
        transaction: transaction.id,
        state: 2,
        reason: null,
      },
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
