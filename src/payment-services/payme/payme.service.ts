import { Injectable, Logger } from '@nestjs/common';
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
import { PaymeError } from './constants/payme-error';
import { DateTime } from 'luxon';
import { CancelingReasons } from './constants/canceling-reasons';
import { Prisma } from '@prisma/client';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationDto } from 'src/notifications/dto/notification.dto';

@Injectable()
export class PaymeService {
  private readonly logger = new Logger(PaymeService.name);
  constructor(
    private readonly prismaService: PrismaService,
    private readonly notificationService: NotificationsService,
  ) {}

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

    const amount = checkPerformTransactionDto.params?.amount / 100; // comes in tiyn and needs to be in sum

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

    const actualPrice = plan.price;
    const discount = plan?.discount || 0;
    const discountExpiredAt = new Date(plan?.discountExpiredAt);
    const isDiscountValid =
      discountExpiredAt && new Date() <= discountExpiredAt;

    let expectedAmount: number;
    console.log('isDiscountValid ', isDiscountValid);

    if (isDiscountValid && discount > 0) {
      console.log('discount', discount);
      expectedAmount = discount;
    } else {
      console.log('amount', amount);
      expectedAmount = actualPrice;
    }

    console.log('expectedAmount', expectedAmount);

    if (amount !== expectedAmount) {
      console.error('Invalid amount');
      return {
        error: PaymeError.InvalidAmount,
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
    const transId = createTransactionDto.params?.id;
    const amount = createTransactionDto.params?.amount;

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

    if (!user) {
      return {
        error: PaymeError.UserNotFound,
        id: transId,
      };
    }

    if (!plan) {
      return {
        error: PaymeError.ProductNotFound,
        id: transId,
      };
    }

    const transaction = await this.prismaService.transactions.findUnique({
      where: {
        transId,
      },
    });

    if (transaction) {
      if (transaction.status !== 'PENDING') {
        return {
          error: PaymeError.CantDoOperation,
          id: transId,
        };
      }

      if (this.checkTransactionExpiration(transaction.createdAt)) {
        await this.prismaService.transactions.update({
          where: {
            transId,
          },
          data: {
            status: 'CANCELED',
            cancelTime: new Date(),
            state: TransactionState.PendingCanceled,
            reason: CancelingReasons.CanceledDueToTimeout,
          },
        });

        return {
          error: {
            ...PaymeError.CantDoOperation,
            state: TransactionState.PendingCanceled,
            reason: CancelingReasons.CanceledDueToTimeout,
          },
          id: transId,
        };
      }

      return {
        result: {
          transaction: transaction.id,
          state: TransactionState.Pending,
          create_time: new Date(transaction.createdAt).getTime(),
        },
      };
    }

    const checkTransaction: CheckPerformTransactionDto = {
      method: TransactionMethods.CheckPerformTransaction,
      params: {
        amount: amount,
        account: {
          planId,
          user_id: userId,
        },
      },
    };

    const checkResult = await this.checkPerformTransaction(checkTransaction);

    if (checkResult.error) {
      return {
        error: checkResult.error,
        id: transId,
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
        state: TransactionState.Pending,
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
    const transaction = await this.prismaService.transactions.findUnique({
      where: {
        transId: performTransactionDto.params.id,
      },
    });

    if (!transaction) {
      return {
        error: PaymeError.TransactionNotFound,
        id: performTransactionDto.params.id,
      };
    }

    if (transaction.status !== 'PENDING') {
      if (transaction.status !== 'PAID') {
        return {
          error: PaymeError.CantDoOperation,
          id: performTransactionDto.params.id,
        };
      }

      return {
        result: {
          state: transaction.state,
          transaction: transaction.id,
          perform_time: new Date(transaction.performTime).getTime(),
        },
      };
    }

    const expirationTime = this.checkTransactionExpiration(
      transaction.createdAt,
    );

    if (expirationTime) {
      await this.prismaService.transactions.update({
        where: {
          transId: performTransactionDto.params.id,
        },
        data: {
          status: 'CANCELED',
          cancelTime: new Date(),
          state: TransactionState.PendingCanceled,
          reason: CancelingReasons.CanceledDueToTimeout,
        },
      });
      return {
        error: {
          state: TransactionState.PendingCanceled,
          reason: CancelingReasons.CanceledDueToTimeout,
          ...PaymeError.CantDoOperation,
        },
        id: performTransactionDto.params.id,
      };
    }

    const plan = await this.prismaService.plans.findUnique({
      where: {
        id: transaction.planId,
      },
    });

    // if user already bought this course
    const myCourse = await this.prismaService.myCourses.findFirst({
      where: {
        userId: transaction.userId,
        planId: plan.id,
      },
    });

    if (myCourse) {
      return {
        error: PaymeError.CantDoOperation,
        id: performTransactionDto.params.id,
      };
    }

    const expirationDate = this.calculateExpirationDate(plan.availablePeriod);

    // create my course
    await this.prismaService.myCourses.create({
      data: {
        userId: transaction.userId,
        courseId: plan.courseId,
        planId: plan.id,
        expirationDate,
      },
    });

    const user = await this.prismaService.users.findUnique({
      where: {
        id: transaction.userId,
      },
    });

    const sendNotificationParams = {};

    if (user?.email) {
      sendNotificationParams['provider'] = 'mail';
      sendNotificationParams['contact'] = user.email;
      sendNotificationParams['package'] = plan?.package;
      this.logger.log(sendNotificationParams, 'sendNotificationParams');
      await this.notificationService.sendNotification(
        sendNotificationParams as NotificationDto,
      );
    } else {
      sendNotificationParams['provider'] = 'sms';
      sendNotificationParams['contact'] = user?.phone;
      sendNotificationParams['package'] = plan?.package;
      this.logger.log(sendNotificationParams, 'sendNotificationParams');
      await this.notificationService.sendNotification(
        sendNotificationParams as NotificationDto,
      );
    }



    const performTime = new Date();

    const updatedPayment = await this.prismaService.transactions.update({
      where: {
        transId: performTransactionDto.params.id,
      },
      data: {
        status: 'PAID',
        state: TransactionState.Paid,
        performTime,
      },
    });

    return {
      result: {
        transaction: updatedPayment.id,
        perform_time: performTime.getTime(),
        state: TransactionState.Paid,
      },
    };
  }

  /**
   * The CancelTransaction method cancels both a created and a completed transaction.
   *
   * @param {CancelTransactionDto} cancelTransactionDto
   */
  async cancelTransaction(cancelTransactionDto: CancelTransactionDto) {
    const transId = cancelTransactionDto.params.id;

    const transaction = await this.prismaService.transactions.findUnique({
      where: {
        transId,
      },
    });

    if (!transaction) {
      return {
        id: transId,
        error: PaymeError.TransactionNotFound,
      };
    }

    if (transaction.status === 'PENDING') {
      const cancelTransaction = await this.prismaService.transactions.update({
        where: {
          id: transaction.id,
        },
        data: {
          status: 'CANCELED',
          state: TransactionState.PendingCanceled,
          cancelTime: new Date(),
          reason: cancelTransactionDto.params.reason,
        },
      });

      return {
        result: {
          cancel_time: cancelTransaction.cancelTime.getTime(),
          transaction: cancelTransaction.id,
          state: TransactionState.PendingCanceled,
        },
      };
    }

    if (transaction.state !== TransactionState.Paid) {
      return {
        result: {
          state: transaction.state,
          transaction: transaction.id,
          cancel_time: transaction.cancelTime.getTime(),
        },
      };
    }

    const deleteUniqueInputs = {
      userId: transaction.userId,
      planId: transaction.planId,
    } as Prisma.MyCoursesWhereUniqueInput;

    await this.prismaService.myCourses.delete({
      where: deleteUniqueInputs,
    });

    const updatedTransaction = await this.prismaService.transactions.update({
      where: {
        id: transaction.id,
      },
      data: {
        status: 'CANCELED',
        state: TransactionState.PaidCanceled,
        cancelTime: new Date(),
        reason: cancelTransactionDto.params.reason,
      },
    });

    return {
      result: {
        cancel_time: updatedTransaction.cancelTime.getTime(),
        transaction: updatedTransaction.id,
        state: TransactionState.PaidCanceled,
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
        error: PaymeError.TransactionNotFound,
        id: checkTransactionDto.params.id,
      };
    }

    return {
      result: {
        create_time: transaction.createdAt.getTime(),
        perform_time: new Date(transaction.performTime).getTime(),
        cancel_time: new Date(transaction.cancelTime).getTime(),
        transaction: transaction.id,
        state: transaction.state,
        reason: transaction.reason,
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
              planId: transaction.planId,
            },
            create_time: new Date(transaction.createdAt).getTime(),
            perform_time: new Date(transaction.performTime).getTime(),
            cancel_time: new Date(transaction.cancelTime).getTime(),
            transaction: transaction.id,
            state: transaction.state,
            reason: transaction.reason || null,
          };
        }),
      },
    };
  }

  private calculateExpirationDate(availablePeriod: number): Date {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + availablePeriod);
    return expirationDate;
  }

  private checkTransactionExpiration(createdAt: Date) {
    const transactionCreatedAt = new Date(createdAt);
    const timeoutDuration = 720;
    const timeoutThreshold = DateTime.now()
      .minus({
        minutes: timeoutDuration,
      })
      .toJSDate();

    return transactionCreatedAt < timeoutThreshold;
  }
}
