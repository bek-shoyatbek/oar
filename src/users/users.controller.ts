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
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { Prisma } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import { STORAGE } from '../constants/storage';
import { getImageValidator } from 'src/utils/custom-validators/image-validator/image-validator';
import { S3Service } from 'src/aws/s3/s3.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly s3Service: S3Service,
  ) {}

  @UseGuards(AuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    const user = await this.usersService.findOneById(req?.user?.userId);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return user;
  }

  @UseGuards(AuthGuard)
  @Patch('profile')
  @UseInterceptors(FileInterceptor('avatar', { storage: STORAGE }))
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

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.usersService.remove(id);
  }
}
