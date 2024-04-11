import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterWithEmailDto } from './dto/register-with-email.dto';
import { RegisterWithPhoneDto } from './dto/register-with-phone.dto';
import { ConfirmCodeDto } from './dto/confirm-code.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {
  }

  @Post('email/register')
  async registerWithEmail(@Body() registerWithEmailDto: RegisterWithEmailDto) {
    return await this.authService.registerWithEmail(registerWithEmailDto);
  }

  @Post('email/login')
  async loginWithEmail(@Body() registerWithEmailDto: RegisterWithEmailDto) {
    return await this.authService.loginWithEmail(registerWithEmailDto);
  }

  @Post('phone/register')
  async registerWithPhone(@Body() registerWithPhoneDto: RegisterWithPhoneDto) {
    return await this.authService.registerWIthPhone(registerWithPhoneDto);
  }

  @Post('phone/login')
  async loginWithPhone(@Body() registerWithPhoneDto: RegisterWithPhoneDto) {
    return await this.authService.loginWithPhone(registerWithPhoneDto);
  }

  @Post('confirm-code')
  async confirmCode(@Body() confirmCodeDto: ConfirmCodeDto) {
    return await this.authService.confirmCode(confirmCodeDto);
  }

}
