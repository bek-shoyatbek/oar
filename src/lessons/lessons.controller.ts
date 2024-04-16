import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { STORAGE } from 'src/users/constants/storage';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { Prisma } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { DriveService } from 'src/google/drive/drive.service';

@Controller('lessons')
export class LessonsController {
  private readonly GOOGLE_DRIVE_FOLDER_ID: string;

  constructor(
    private readonly lessonsService: LessonsService,
    private cloudinary: CloudinaryService,
    private readonly googleDriveService: DriveService,
    private readonly configService: ConfigService,
  ) {
    this.GOOGLE_DRIVE_FOLDER_ID =
      this.configService.get<string>('GD_FOLDER_ID');
  }
  @Post('create/:moduleId')
  @UseInterceptors(FileInterceptor('video', { storage: STORAGE }))
  async create(
    @Param('moduleId') moduleId: string,
    @Body() createLessonDto: Prisma.LessonCreateInput,
    @UploadedFile() video: Express.Multer.File,
  ) {
    if (!video) {
      throw new BadRequestException('video is required');
    }
    console.log('video', video);
    const avatarUrl = await this.googleDriveService.uploadFile(video);
    console.log('avatarUrl', avatarUrl);
    // createLessonDto.video = avatarUrl;
    // const uploadToCDNResult = await this.cloudinary.upload(video, 'video');
    // if (uploadToCDNResult?.error) {
    //   throw new BadRequestException(uploadToCDNResult.error);
    // }

    // createLessonDto.video = uploadToCDNResult.url;
    return 'Done';
    // return await this.lessonsService.create(moduleId, createLessonDto);
  }

  @Get('single/:id')
  async findOne(@Param('id') id: string) {
    return await this.lessonsService.findOne(id);
  }

  @Patch('update/:id')
  @UseInterceptors(FileInterceptor('video', { storage: STORAGE }))
  async update(
    @Body() updateLessonDto: Prisma.LessonUpdateInput,
    @Param('id') id: string,
    @UploadedFile() video: Express.Multer.File,
  ) {
    if (video) {
      const uploadToCDNResult = await this.cloudinary.upload(video, 'video');
      if (uploadToCDNResult?.error) {
        throw new BadRequestException(uploadToCDNResult.error);
      }

      updateLessonDto.video = uploadToCDNResult.url;
    }

    return await this.lessonsService.update(id, updateLessonDto);
  }

  @Delete('delete/:id')
  async delete(@Param('id') id: string) {
    return await this.lessonsService.remove(id);
  }
}
