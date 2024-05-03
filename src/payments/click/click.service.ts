import { BadRequestException, Injectable } from '@nestjs/common';
import { ClickRequestDto } from './dto/click-request.dto';
import { TransactionActions } from './constants/transaction-actions';
import { ObjectId } from 'mongodb';
import { PrismaService } from 'src/prisma.service';
import { HashingService } from 'src/utils/hashing/hashing.service';
import { ConfigService } from '@nestjs/config';
import { CreateMd5Params } from './interfaces/create-md5.interface';
import { ClickError } from 'src/enums/Payment.enum';

@Injectable()
export class ClickService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly hashingService: HashingService,
    private readonly configService: ConfigService,
  ) {}

  async handleMerchantTransactions(clickReqBody: ClickRequestDto) {
    console.log('reqBody', clickReqBody);

    const actionType = +clickReqBody.action;

    if (isNaN(actionType)) {
      console.error('Invalid action');
      return {
        error_code: ClickError.ActionNotFound,
        error_msg: 'Invalid action',
      };
    }

    if (actionType == TransactionActions.Prepare) {
      return this.preparePayment(clickReqBody);
    } else if (actionType == TransactionActions.Complete) {
      return this.completePayment(clickReqBody);
    } else {
      return {
        error_code: ClickError.ActionNotFound,
        error_msg: 'Invalid action',
      };
    }
  }

  async preparePayment(clickReqBody: ClickRequestDto) {
    const secretKey = this.configService.get<string>('CLICK_SECRET');
    const merchantTransactionId = clickReqBody.merchant_trans_id;
    const md5Hash = this.hashingService.md5(
      `${clickReqBody.click_trans_id}${clickReqBody.service_id}${secretKey}${merchantTransactionId}${clickReqBody.amount}${clickReqBody.action}${clickReqBody.sign_time}`,
    );
    const isValidSignature = this.verifyMd5Hash(
      clickReqBody.sign_string,
      md5Hash,
    );

    if (!isValidSignature) {
      console.error('Invalid sign_string');
      return {
        error_code: ClickError.SignFailed,
        error_msg: 'Invalid sign_string',
      };
    }

    const isValidObjectId = this.checkObjectId(clickReqBody.merchant_trans_id);

    if (!isValidObjectId) {
      console.error('Invalid merchant_trans_id');
      return {
        error_code: ClickError.BadRequest,
        error_msg: 'Invalid merchant_trans_id',
      };
    }

    const plan = await this.prismaService.plans.findUnique({
      where: {
        id: clickReqBody.merchant_trans_id,
      },
    });

    if (!plan) {
      console.error('Invalid merchant_trans_id');
      return {
        error_code: ClickError.BadRequest,
        error_msg: 'Invalid merchant_trans_id',
      };
    }

    const isAlreadyPaid = await this.prismaService.transactions.findFirst({
      where: {
        userId: clickReqBody.merchant_user_id,
        planId: clickReqBody.merchant_trans_id,
        status: 'PAID',
      },
    });

    if (isAlreadyPaid) {
      console.error('Already paid');
      return {
        error_code: ClickError.AlreadyPaid,
        error_msg: 'Already paid',
      };
    }

    if (clickReqBody.amount < 0 || clickReqBody.amount != plan.price) {
      console.error('Invalid amount');
      return {
        error_code: ClickError.InvalidAmount,
        error_msg: 'Invalid amount',
      };
    }

    const time = new Date().getTime();

    await this.prismaService.transactions.create({
      data: {
        plan: {
          connect: {
            id: plan.id,
          },
        },
        user: {
          connect: {
            id: clickReqBody.merchant_user_id,
          },
        },
        prepareId: time,
        status: 'PENDING',
        provider: 'click',
        amount: clickReqBody.amount,
        createdAt: new Date(time),
      },
    });

    return {
      click_trans_id: clickReqBody.click_trans_id,
      merchant_trans_id: clickReqBody.merchant_trans_id,
      merchant_prepare_id: time,
      error: ClickError.Success,
      error_note: 'Success',
    };
  }

  async completePayment(clickReqBody: ClickRequestDto) {
    const isValidObjectId = this.checkObjectId(clickReqBody.merchant_trans_id);
    if (!isValidObjectId) {
      console.error('Invalid merchant_trans_id');
      return {
        error_code: ClickError.BadRequest,
        error_msg: 'Invalid merchant_trans_id',
      };
    }

    const plan = await this.prismaService.plans.findUnique({
      where: {
        id: clickReqBody.merchant_trans_id,
      },
    });

    if (!plan) {
      console.error('Invalid merchant_trans_id');
      return {
        error_code: ClickError.BadRequest,
        error_msg: 'Invalid merchant_trans_id',
      };
    }

    const transaction = await this.prismaService.transactions.findFirst({
      where: {
        planId: clickReqBody.merchant_trans_id,
        prepareId: +clickReqBody.merchant_prepare_id,
        status: 'PENDING',
      },
    });

    if (!transaction) {
      console.error('Invalid merchant_prepare_id');
      return {
        error_code: ClickError.BadRequest,
        error_msg: 'Invalid merchant_prepare_id',
      };
    }

    if (transaction.status == 'PAID') {
      console.error('Already paid');
      return {
        error_code: ClickError.AlreadyPaid,
        error_msg: 'Already paid',
      };
    }

    if (transaction.status == 'CANCELED') {
      console.error('Already cancelled');
      return {
        error_code: ClickError.TransactionCanceled,
        error_msg: 'Already cancelled',
      };
    }

    if (clickReqBody.amount < 0 || clickReqBody.amount != transaction.amount) {
      console.error('Invalid amount');
      return {
        error_code: ClickError.InvalidAmount,
        error_msg: 'Invalid amount',
      };
    }

    // update payment status
    await this.prismaService.transactions.update({
      where: {
        id: transaction.id,
      },
      data: {
        status: 'PAID',
      },
    });

    await this.prismaService.myCourses.update({
      where: {
        userId: transaction.userId,
      },
      data: {
        courseId: plan.courseId,
      },
    });

    const response = {
      click_trans_id: +clickReqBody.click_trans_id,
      merchant_trans_id: clickReqBody.merchant_trans_id,
      merchant_confirm_id: null,
      error_code: 0,
      error_msg: 'Success',
    };

    return response;
  }

  checkObjectId(id: string) {
    return ObjectId.isValid(id);
  }

  generateMd5Hash(content: CreateMd5Params) {
    return this.hashingService.md5(
      `${content.clickTransId}${content.serviceId}${content.secretKey}${content.merchantTransId}${content.merchantPrepareId}${content.amount}${content.action}${content.signTime}`,
    );
  }

  verifyMd5Hash(incomingSign: string, mySign: string) {
    return incomingSign == mySign;
  }
}
