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
import { STORAGE } from 'src/constants/storage';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { Prisma } from '@prisma/client';
import { S3Service } from 'src/aws/s3/s3.service';

@Controller('lessons')
export class LessonsController {
  constructor(
    private readonly lessonsService: LessonsService,
    private cloudinary: CloudinaryService,
    private readonly s3Service: S3Service,
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
    const fileUrl = await this.s3Service.upload(video);

    createLessonDto.video = fileUrl;

    return await this.lessonsService.create(moduleId, createLessonDto);
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
      const fileUrl = await this.s3Service.upload(video);

      updateLessonDto.video = fileUrl;
    }

    return await this.lessonsService.update(id, updateLessonDto);
  }

  @Delete('delete/:id')
  async delete(@Param('id') id: string) {
    return await this.lessonsService.remove(id);
  }
}
