import {
  BadRequestException,
  Body,
  Controller,
  Delete,
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

@Controller('lessons')
export class LessonsController {
  constructor(
    private readonly lessonsService: LessonsService,
    private cloudinary: CloudinaryService,
  ) {}
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
    const uploadToCDNResult = await this.cloudinary.upload(video, 'video');
    if (uploadToCDNResult?.error) {
      throw new BadRequestException(uploadToCDNResult.error);
    }

    createLessonDto.video = uploadToCDNResult.url;
    return await this.lessonsService.create(moduleId, createLessonDto);
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
