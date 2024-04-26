import { Injectable } from '@nestjs/common';
import { TransactionMethods } from './constants/transaction-methods';

@Injectable()
export class PaymeService {
  constructor() {}

  async handleTransactionMethods(method: string) {
    switch (method) {
      case TransactionMethods.CheckPerformTransaction:
        return 'CheckPerformTransaction';

      case TransactionMethods.CreateTransaction:
        return 'CreateTransaction';

      case TransactionMethods.CheckTransaction:
        return 'CheckTransaction';

      case TransactionMethods.PerformTransaction:
        return 'PerformTransaction';

      case TransactionMethods.CancelTransaction:
        return 'CancelTransaction';

      default:
        return 'Invalid transaction method';
    }
  }
}
