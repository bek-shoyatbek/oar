import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterWithEmailDto } from './dto/register-with-email.dto';
import { RegisterWithPhoneDto } from './dto/register-with-phone.dto';
import { ConfirmCodeDto } from './dto/confirm-code.dto';
import { ResetUserPasswordDto } from './dto/reset-user-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('email/register')
  async registerWithEmail(@Body() registerWithEmailDto: RegisterWithEmailDto) {
    return await this.authService.registerWithEmail(registerWithEmailDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('email/login')
  async loginWithEmail(@Body() registerWithEmailDto: RegisterWithEmailDto) {
    return await this.authService.loginWithEmail(registerWithEmailDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('phone/register')
  async registerWithPhone(@Body() registerWithPhoneDto: RegisterWithPhoneDto) {
    return await this.authService.registerWithPhone(registerWithPhoneDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('phone/login')
  async loginWithPhone(@Body() registerWithPhoneDto: RegisterWithPhoneDto) {
    return await this.authService.loginWithPhone(registerWithPhoneDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('confirm-code')
  async confirmCode(@Body() confirmCodeDto: ConfirmCodeDto) {
    return await this.authService.confirmCode(confirmCodeDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('email/send-reset-code')
  async sendResetCodeByEmail(@Body('email') email: string) {
    return await this.authService.sendResetCodeByEmail(email);
  }

  @HttpCode(HttpStatus.OK)
  @Post('phone/send-reset-code')
  async sendResetCodeByPhone(@Body('phone') phone: string) {
    return await this.authService.sendResetCodeByPhone(phone);
  }

  @HttpCode(HttpStatus.OK)
  @Post('reset-user-password')
  async resetUserPassword(@Body() resetUserPasswordDto: ResetUserPasswordDto) {
    return await this.authService.resetUserPassword(resetUserPasswordDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh-access-token')
  async refreshToken(@Body('accessToken') accessToken: string) {
    return 'refresh access token';
    // return await this.authService.refreshToken(accessToken);
  }
}
