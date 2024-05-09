import { IsNotEmpty, IsString } from 'class-validator';

export class ResetUserPasswordDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @IsString()
  @IsNotEmpty()
  confirmationCode: string;

  @IsNotEmpty()
  @IsString()
  newPassword: string;
}
