import { BadRequestException, Injectable } from '@nestjs/common';
import { ClickRequestDto } from './dto/click-request.dto';
import { TransactionActions } from './constants/transaction-actions';
import { ObjectId } from 'mongodb';
import { PrismaService } from 'src/prisma.service';
import { HashingService } from 'src/utils/hashing/hashing.service';
import { ConfigService } from '@nestjs/config';
import { CreateMd5Params } from './interfaces/create-md5.interface';
import { ClickReplyOption } from './entities/ReplyOption';
import { ClickError } from 'src/enums/Payment.enum';

@Injectable()
export class ClickService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly hashingService: HashingService,
    private readonly configService: ConfigService,
  ) {}

  async handleMerchantTransactions(clickReqBody: ClickRequestDto) {
    const merchantTransactionId = clickReqBody.merchant_trans_id;

    console.log('reqBody', clickReqBody);

    const actionType = +clickReqBody.action;

    if (isNaN(actionType)) {
      console.error('Invalid action');
      throw new BadRequestException({
        click_trans_id: clickReqBody.click_trans_id,
        merchant_trans_id: merchantTransactionId,
        error_code: 1,
        error_msg: 'Invalid action',
      });
    }

    if (actionType == TransactionActions.Prepare) {
      return this.preparePayment(clickReqBody);
    } else if (actionType == TransactionActions.Complete) {
      return this.completePayment(clickReqBody);
    } else {
      throw new BadRequestException({
        click_trans_id: clickReqBody.click_trans_id,
        merchant_trans_id: merchantTransactionId,
        error_code: 1,
        error_msg: 'Invalid action',
      });
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
      throw new BadRequestException({
        click_trans_id: clickReqBody.click_trans_id,
        merchant_trans_id: merchantTransactionId,
        error_code: 1,
        error_msg: 'Invalid sign_string',
      });
    }

    const isValidObjectId = this.checkObjectId(clickReqBody.merchant_trans_id);

    if (!isValidObjectId) {
      console.error('Invalid merchant_trans_id');
      throw new BadRequestException({
        click_trans_id: clickReqBody.click_trans_id,
        merchant_trans_id: merchantTransactionId,
        error_code: 1,
        error_msg: 'Invalid merchant_trans_id',
      });
    }

    const isValidPaymentId = await this.prismaService.payments.findUnique({
      where: {
        id: clickReqBody.merchant_trans_id,
      },
    });

    if (!isValidPaymentId) {
      console.error('Invalid merchant_trans_id');
      throw new BadRequestException({
        click_trans_id: clickReqBody.click_trans_id,
        merchant_trans_id: merchantTransactionId,
        error_code: 1,
        error_msg: 'Invalid merchant_trans_id',
      });
    }

    const isAlreadyPaid = await this.prismaService.payments.findFirst({
      where: {
        id: clickReqBody.merchant_trans_id,
        status: 'PAID',
      },
    });

    if (isAlreadyPaid) {
      console.error('Already paid');
      throw new BadRequestException({
        click_trans_id: clickReqBody.click_trans_id,
        merchant_trans_id: merchantTransactionId,
        error_code: ClickError.AlreadyPaid,
        error_msg: 'Already paid',
      });
    }

    if (
      clickReqBody.amount < 0 ||
      clickReqBody.amount != isValidPaymentId.amount
    ) {
      console.error('Invalid amount');
      throw new BadRequestException({
        click_trans_id: clickReqBody.click_trans_id,
        merchant_trans_id: merchantTransactionId,
        error_code: ClickError.InvalidAmount,
        error_msg: 'Invalid amount',
      });
    }

    if (isValidPaymentId.status == 'PAID') {
      console.error('Already paid');
      throw new BadRequestException({
        click_trans_id: clickReqBody.click_trans_id,
        merchant_trans_id: merchantTransactionId,
        error_code: ClickError.AlreadyPaid,
        error_msg: 'Already paid',
      });
    }

    if (isValidPaymentId.status == 'CANCELED') {
      console.error('Already cancelled');
      throw new BadRequestException({
        click_trans_id: clickReqBody.click_trans_id,
        merchant_trans_id: merchantTransactionId,
        error_code: ClickError.TransactionCanceled,
        error_msg: 'Already cancelled',
      });
    }

    const time = new Date().getTime();

    await this.prismaService.payments.update({
      where: {
        id: clickReqBody.merchant_trans_id,
      },
      data: {
        prepareId: time,
      },
    });

    const reply = new ClickReplyOption(
      clickReqBody.click_trans_id,
      clickReqBody.merchant_trans_id,
      time,
      0,
      'Success',
    );
    return reply.getReplyObject();
  }

  async completePayment(clickReqBody: ClickRequestDto) {
    const isValidObjectId = this.checkObjectId(clickReqBody.merchant_trans_id);
    if (!isValidObjectId) {
      const reply = new ClickReplyOption(
        clickReqBody.click_trans_id,
        clickReqBody.merchant_trans_id,
        +clickReqBody.merchant_prepare_id,
        1,
        'Invalid merchant_trans_id',
      );

      console.error('Invalid merchant_trans_id', reply.getReplyObject());
      throw new BadRequestException(reply.getReplyObject());
    }
    const isValidPaymentId = await this.prismaService.payments.findUnique({
      where: {
        id: clickReqBody.merchant_trans_id,
      },
    });
    if (!isValidPaymentId) {
      console.error('Invalid merchant_trans_id');
      const reply = new ClickReplyOption(
        clickReqBody.click_trans_id,
        clickReqBody.merchant_trans_id,
        +clickReqBody.merchant_prepare_id,
        ClickError.BadRequest,
        'Invalid merchant_trans_id',
      );

      console.error('Invalid merchant_trans_id', reply.getReplyObject());
      throw new BadRequestException(reply.getReplyObject());
    }

    const isPrepared = await this.prismaService.payments.findFirst({
      where: {
        prepareId: +clickReqBody.merchant_prepare_id,
      },
    });

    if (!isPrepared) {
      console.error('Invalid merchant_prepare_id');
      throw new BadRequestException({
        click_trans_id: clickReqBody.click_trans_id,
        merchant_trans_id: clickReqBody.merchant_trans_id,
        error_code: ClickError.TransactionNotFound,
        error_msg: 'Invalid merchant_prepare_id',
      });
    }

    if (isValidPaymentId.status == 'PAID') {
      console.error('Already paid');
      throw new BadRequestException({
        click_trans_id: clickReqBody.click_trans_id,
        merchant_trans_id: clickReqBody.merchant_trans_id,
        error_code: ClickError.AlreadyPaid,
        error_msg: 'Already paid',
      });
    }

    if (isValidPaymentId.status == 'CANCELED') {
      console.error('Already cancelled');
      throw new BadRequestException({
        click_trans_id: clickReqBody.click_trans_id,
        merchant_trans_id: clickReqBody.merchant_trans_id,
        error_code: ClickError.TransactionCanceled,
        error_msg: 'Already cancelled',
      });
    }

    if (
      clickReqBody.amount < 0 ||
      clickReqBody.amount != isValidPaymentId.amount
    ) {
      console.error('Invalid amount');
      throw new BadRequestException({
        click_trans_id: clickReqBody.click_trans_id,
        merchant_trans_id: clickReqBody.merchant_trans_id,
        error_code: ClickError.InvalidAmount,
        error_msg: 'Invalid amount',
      });
    }

    // update payment status
    await this.prismaService.payments.update({
      where: {
        id: clickReqBody.merchant_trans_id,
      },
      data: {
        status: 'PAID',
      },
    });

    const reply = new ClickReplyOption(
      clickReqBody.click_trans_id,
      clickReqBody.merchant_trans_id,
      clickReqBody.merchant_prepare_id,
      0,
      'Success',
    );

    return reply.getReplyObject();
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
