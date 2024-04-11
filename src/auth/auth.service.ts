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
import { UsersService } from 'src/users/users.service';
import { HashingService } from 'src/utils/hashing/hashing.service';

@Injectable()
export class AuthService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private mailService: MailService,
    private generatorService: GeneratorService,
    private jwtService: JwtService,
    private userService: UsersService,
    private hashingService: HashingService,
  ) {}

  async registerWithEmail(registerWithEmailDto: RegisterWithEmailDto) {
    const isValidEmail = await this.userService.findOneByEmail(
      registerWithEmailDto.email,
    );

    if (isValidEmail) {
      throw new BadRequestException('Email already exists');
    }

    const sessionId = this.generatorService.generateUUID();
    const code = this.generatorService.generateConfirmationCode();
    const message = this.generatorService.generateConfirmationMessage(
      code,
      'email',
    );

    await this.mailService.sendMail({
      to: registerWithEmailDto.email,
      subject: 'Confirmation code',
      html: message,
    });

    registerWithEmailDto.password = await this.hashingService.hashPassword(
      registerWithEmailDto.password,
    );
    const credentials = {
      userData: registerWithEmailDto,
      code,
    };

    await this.cacheManager.set(
      sessionId,
      JSON.stringify(credentials),
      1000 * 60 * 5,
    ); // 5 min
    return sessionId;
  }

  async loginWithEmail(loginWithEmailDto: LoginWithEmailDto) {
    const isValidEmail = await this.userService.findOneByEmail(
      loginWithEmailDto.email,
    );
    if (!isValidEmail) {
      throw new BadRequestException('Email not found');
    }

    const isValidPassword = await this.hashingService.comparePassword(
      loginWithEmailDto.password,
      isValidEmail.password,
    );

    if (!isValidPassword) {
      throw new BadRequestException('Invalid password');
    }

    const accessToken = await this.jwtService.signAsync(
      {
        userId: isValidEmail.id,
      },
      {
        expiresIn: '1d',
      },
    );

    const refreshToken = await this.jwtService.signAsync(
      {
        userId: isValidEmail.id,
      },
      {
        expiresIn: '30d',
      },
    );
    return {
      accessToken,
      refreshToken,
    };
  }

  async registerWithPhone(registerWithPhoneDto: RegisterWithPhoneDto) {
    const isValidPhone = await this.userService.findOneByPhone(
      registerWithPhoneDto.phone,
    );

    if (isValidPhone) {
      throw new BadRequestException('Phone already exists');
    }
    const sessionId = this.generatorService.generateUUID();
    const code = this.generatorService.generateConfirmationCode();
    const message = this.generatorService.generateConfirmationMessage(
      code,
      'phone',
    );

    // TODO send sms
    // await this.mailService.sendMail({
    //   to: registerWithPhoneDto.phone,
    //   subject: 'Confirmation code',
    //   html: message,
    // });

    registerWithPhoneDto.password = await this.hashingService.hashPassword(
      registerWithPhoneDto.password,
    );
    const credentials = {
      userData: registerWithPhoneDto,
      code,
    };

    await this.cacheManager.set(
      sessionId,
      JSON.stringify(credentials),
      1000 * 60 * 5,
    ); // 5 min
    return sessionId;
  }

  async loginWithPhone(loginWithPhoneDto: LoginWithPhoneDto) {
    const isValidPhone = await this.userService.findOneByPhone(
      loginWithPhoneDto.phone,
    );

    if (!isValidPhone) {
      throw new BadRequestException('Phone not found');
    }
    const isValidPassword = await this.hashingService.comparePassword(
      loginWithPhoneDto.password,
      isValidPhone.password,
    );

    if (!isValidPassword) {
      throw new BadRequestException('Invalid password');
    }

    const accessToken = await this.jwtService.signAsync(
      {
        userId: isValidPhone.id,
      },
      {
        expiresIn: '1d',
      },
    );

    const refreshToken = await this.jwtService.signAsync(
      {
        userId: isValidPhone.id,
      },
      {
        expiresIn: '30d',
      },
    );
    return {
      accessToken,
      refreshToken,
    };
  }

  async confirmCode(confirmCodeDto: ConfirmCodeDto) {
    const user = (await this.cacheManager.get(
      confirmCodeDto.sessionId,
    )) as string;

    if (!user) {
      throw new BadRequestException('Invalid sessionId or code');
    }

    const credentials = JSON.parse(user);

    if (credentials.code !== +confirmCodeDto.code) {
      throw new BadRequestException('Invalid code');
    }
    const accessToken = await this.jwtService.signAsync(
      {
        userId: credentials.userData.id,
      },
      {
        expiresIn: '1d',
      },
    );

    const refreshToken = await this.jwtService.signAsync(
      {
        userId: credentials.userData.id,
      },
      {
        expiresIn: '30d',
      },
    );

    const newUser = {
      ...credentials.userData,
      refreshToken,
    };

    await this.userService.create(newUser);

    await this.cacheManager.del(confirmCodeDto.sessionId);

    return {
      accessToken,
      refreshToken,
    };
  }
}
