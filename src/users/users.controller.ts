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
import { AuthGuard } from 'src/auth/auth.guard';
import { Prisma } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import { STORAGE } from './constants/storage';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { getAvatarValidator } from 'src/utils/custom-validators/avatar-validator/avatar-validator';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private cloudinary: CloudinaryService,
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
    @Body() updateUserDto: Prisma.UserUpdateInput,
    @UploadedFile(getAvatarValidator()) avatar: Express.Multer.File,
  ) {
    const userId = req?.user?.userId;

    if (avatar) {
      const uploadToCDNResult = await this.cloudinary.upload(avatar);
      if (uploadToCDNResult?.error) {
        throw new BadRequestException(uploadToCDNResult.error);
      }

      updateUserDto.avatar = uploadToCDNResult.url;
    }

    return await this.usersService.update(userId, updateUserDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.usersService.remove(id);
  }
}
