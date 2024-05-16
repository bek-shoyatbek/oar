import {
  Controller,
  Body,
  Patch,
  Param,
  Delete,
  Get,
  UseGuards,
  Request,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
  UseFilters,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { Prisma } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import { STORAGE } from '../constants/storage';
import { getImageValidator } from 'src/utils/custom-validators/image-validator/image-validator';
import { S3Service } from 'src/aws/s3/s3.service';
import { PrismaClientExceptionFilter } from '../exception-filters/prisma/prisma.filter';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly s3Service: S3Service,
  ) {}

  @Get('profile')
  @UseFilters(PrismaClientExceptionFilter)
  async getProfile(@Request() req) {
    const user = await this.usersService.findOneById(req?.user?.userId);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return user;
  }

  @Patch('profile')
  @UseInterceptors(FileInterceptor('avatar', { storage: STORAGE }))
  @UseFilters(PrismaClientExceptionFilter)
  async update(
    @Request() req,
    @Body() updateUserDto: Prisma.UsersUpdateInput,
    @UploadedFile(getImageValidator()) avatar: Express.Multer.File,
  ) {
    const userId = req?.user?.userId;

    if (avatar) {
      const fileUrl = await this.s3Service.upload(avatar);

      updateUserDto.avatar = fileUrl;
    }

    return await this.usersService.update(userId, updateUserDto);
  }

  @Delete()
  @UseFilters(PrismaClientExceptionFilter)
  async remove(@Request() req) {
    const id = req?.user?.userId;
    return await this.usersService.remove(id);
  }
}
