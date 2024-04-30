export class CreateTransactionDto {
  serviceId: number;
  timestamp: number;
  transId: string;
  params: {
    account: string;
    [key: string]: any;
  };
  amount: number;
}
