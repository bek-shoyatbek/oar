export class CreateTransactionDto {
  serviceId: number;
  timestamp: number;
  transId: string;
  params: {
    planId: string;
    userId: string;
  };
  amount: number;
}
