import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { RegisterWithEmailDto } from './dto/register-with-email.dto';
import { LoginWithEmailDto } from './dto/login-with-email.dto';
import { RegisterWithPhoneDto } from './dto/register-with-phone.dto';
import { LoginWithPhoneDto } from './dto/login-with-phone.dto';
import { ConfirmCodeDto } from './dto/confirm-code.dto';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { MailService } from '../mail/mail.service';
import { GeneratorService } from '../utils/generator/generator.service';
import { JwtService } from '@nestjs/jwt';


@Injectable()
export class AuthService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache,
              private mailService: MailService,
              private generatorService: GeneratorService,
              private jwtService: JwtService) {
  }

  async registerWithEmail(registerWithEmailDto: RegisterWithEmailDto) {
    const sessionId = this.generatorService.generateUUID();
    const code = this.generatorService.generateConfirmationCode();
    const message = this.generatorService.generateConfirmationMessage(code);

    await this.mailService.sendMail({
      to: registerWithEmailDto.email,
      subject: 'Confirmation code',
      html: message,
    });
    const credentials = {
      userData: registerWithEmailDto,
      code,
    };
    await this.cacheManager.set(sessionId, JSON.stringify(credentials), 1000 * 60 * 5); // 5 min
    return sessionId;
  }

  async loginWithEmail(loginWithEmailDto: LoginWithEmailDto) {
    return `This action login with email `;
  }

  async registerWIthPhone(registerWithPhoneDto: RegisterWithPhoneDto) {
    return `Register with phone`;
  }

  async loginWithPhone(loginWithPhoneDto: LoginWithPhoneDto) {
    return `This login with phone`;
  }

  async confirmCode(confirmCodeDto: ConfirmCodeDto) {
    const user = await this.cacheManager.get(confirmCodeDto.sessionId) as string;
    if (!user) {
      throw new BadRequestException('Invalid sessionId or code');
    }

    const credentials = JSON.parse(user);
    if (credentials.code !== confirmCodeDto.code) {
      throw new BadRequestException('Invalid code');
    }

    await this.cacheManager.del(confirmCodeDto.sessionId);

    return await this.jwtService.signAsync({
      email: credentials.userData.email,
      sub: credentials.userData.id,
    });
  }
}
