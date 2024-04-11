import { IsNotEmpty, IsPhoneNumber, IsStrongPassword } from 'class-validator';
import { PASSWORD_OPTIONS } from 'src/constants/password-options';

export class RegisterWithPhoneDto {
  @IsNotEmpty({ message: 'Phone is required' })
  @IsPhoneNumber('UZ')
  phone: string;
  @IsNotEmpty({ message: 'Password is required' })
  @IsStrongPassword(PASSWORD_OPTIONS)
  password: string;
}
