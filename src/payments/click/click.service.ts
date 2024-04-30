import { BadRequestException, Injectable } from '@nestjs/common';
import { ClickRequestDto } from './dto/click-request.dto';
import { TransactionActions } from './constants/transaction-actions';
import { ObjectId } from 'mongodb';
import { PrismaService } from 'src/prisma.service';
import { HashingService } from 'src/utils/hashing/hashing.service';
import { ConfigService } from '@nestjs/config';
import { CreateMd5Params } from './interfaces/create-md5.interface';
import { ClickReplyOption } from './entities/ReplyOption';

@Injectable()
export class ClickService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly hashingService: HashingService,
    private readonly configService: ConfigService,
  ) {}

  async handleMerchantTransactions(clickReqBody: ClickRequestDto) {
    const secretKey = this.configService.get<string>('CLICK_SECRET');
    const merchantTransactionId = clickReqBody.merchant_trans_id;
    const actionType = +clickReqBody.action;
    const md5Hash = this.hashingService.md5(
      `${clickReqBody.click_trans_id}${clickReqBody.service_id}${secretKey}${merchantTransactionId}${clickReqBody.amount}${clickReqBody.action}${clickReqBody.sign_time}`,
    );
    const isValidSignature = this.verifyMd5Hash(
      clickReqBody.sign_string,
      md5Hash,
    );

    if (!isValidSignature) {
      throw new BadRequestException({
        click_trans_id: clickReqBody.click_trans_id,
        merchant_trans_id: merchantTransactionId,
        merchant_prepare_id: clickReqBody.merchant_prepare_id,
        error_code: 1,
        error_msg: 'Invalid sign_string',
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
        merchant_prepare_id: clickReqBody.merchant_prepare_id,
        error_code: 1,
        error_msg: 'Invalid action',
      });
    }
  }

  async preparePayment(clickReqBody: ClickRequestDto) {
    const isValidObjectId = this.checkObjectId(clickReqBody.merchant_trans_id);

    if (!isValidObjectId) {
      const reply = new ClickReplyOption(
        clickReqBody.click_trans_id,
        clickReqBody.merchant_trans_id,
        clickReqBody.merchant_prepare_id,
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
      const reply = new ClickReplyOption(
        clickReqBody.click_trans_id,
        clickReqBody.merchant_trans_id,
        clickReqBody.merchant_prepare_id,
        1,
        'Invalid merchant_trans_id',
      );

      console.error('Invalid merchant_trans_id', reply.getReplyObject());
      throw new BadRequestException(reply.getReplyObject());
    }

    const reply = new ClickReplyOption(
      clickReqBody.click_trans_id,
      clickReqBody.merchant_trans_id,
      clickReqBody.merchant_prepare_id,
      0,
      'ok',
    );
    return reply.getReplyObject();
  }

  async completePayment(clickReqBody: ClickRequestDto) {
    const isValidObjectId = this.checkObjectId(clickReqBody.merchant_trans_id);
    if (!isValidObjectId) {
      const reply = new ClickReplyOption(
        clickReqBody.click_trans_id,
        clickReqBody.merchant_trans_id,
        clickReqBody.merchant_prepare_id,
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
      const reply = new ClickReplyOption(
        clickReqBody.click_trans_id,
        clickReqBody.merchant_trans_id,
        clickReqBody.merchant_prepare_id,
        1,
        'Invalid merchant_trans_id',
      );

      console.error('Invalid merchant_trans_id', reply.getReplyObject());
      throw new BadRequestException(reply.getReplyObject());
    }

    const reply = new ClickReplyOption(
      clickReqBody.click_trans_id,
      clickReqBody.merchant_trans_id,
      clickReqBody.merchant_prepare_id,
      0,
      'Completed',
    );

    // update payment status
    await this.prismaService.payments.update({
      where: {
        id: clickReqBody.merchant_trans_id,
      },
      data: {
        status: 'completed',
      },
    });

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
