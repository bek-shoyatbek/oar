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

    console.log('ReqBody', clickReqBody);
    const incomingMd5Hash = clickReqBody.sign_string;

    const myMd5Hash = this.hashingService.md5(
      `${clickReqBody.click_trans_id}${clickReqBody.service_id}${secretKey}${clickReqBody.merchant_trans_id}${clickReqBody.amount}${clickReqBody.action}${clickReqBody.sign_time}`,
    );

    const isValidSignString = this.verifyMd5Hash(incomingMd5Hash, myMd5Hash);

    if (!isValidSignString) {
      const reply = new ClickReplyOption(
        clickReqBody.click_trans_id,
        clickReqBody.merchant_trans_id,
        clickReqBody?.merchant_prepare_id,
        1,
        'Invalid sign_string',
      );
      console.error('Invalid sign_string', reply.getReplyObject());
      throw new BadRequestException(reply.getReplyObject());
    }

    const action = clickReqBody.action;
    if (action == TransactionActions.Prepare) {
      return await this.preparePayment(clickReqBody);
    } else if (action == TransactionActions.Complete) {
      return await this.completePayment(clickReqBody);
    }

    const reply = new ClickReplyOption(
      clickReqBody.click_trans_id,
      clickReqBody.merchant_trans_id,
      clickReqBody.merchant_prepare_id,
      1,
      'Invalid action',
    );

    return reply.getReplyObject();
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
