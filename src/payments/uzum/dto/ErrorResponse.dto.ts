export class ErrorResponseDto {
  serviceId: number;
  timestamp: number;
  status: string;
  errorCode: number;
  constructor(
    serviceId: number,
    timestamp: number,
    status: string,
    errorCode: number,
  ) {
    this.serviceId = serviceId;
    this.timestamp = timestamp;
    this.status = status;
    this.errorCode = errorCode;
  }

  getResponse() {
    return {
      serviceId: this.serviceId,
      timestamp: this.timestamp,
      status: this.status,
      errorCode: this.errorCode,
    };
  }
}
