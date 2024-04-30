export class CheckTransactionDto {
  serviceId: number;
  timestamp: number;
  params: {
    account: string;
    [key: string]: any;
  };
}
