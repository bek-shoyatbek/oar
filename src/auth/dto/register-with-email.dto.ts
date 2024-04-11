import { IsEmail, IsNotEmpty, IsStrongPassword } from 'class-validator';
import { PASSWORD_OPTIONS } from 'src/constants/password-options';

export class RegisterWithEmailDto {
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail()
  email: string;

  @IsNotEmpty({ message: 'Password is required' })
  @IsStrongPassword(PASSWORD_OPTIONS)
  password: string;
}
