import { IsNotEmpty, IsString } from 'class-validator';

export class ConfirmCodeDto {
  @IsNotEmpty({ message: 'sessionId is required' })
  @IsString({ message: 'sessionId must be a string' })
  sessionId: string;

  @IsNotEmpty({ message: 'code is required' })
  @IsString({ message: 'code must be a string' })
  code: string;
}
