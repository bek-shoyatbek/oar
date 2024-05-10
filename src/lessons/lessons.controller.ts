import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFiles,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { STORAGE } from 'src/constants/storage';
import { Prisma } from '@prisma/client';
import { S3Service } from 'src/aws/s3/s3.service';
import { PrismaClientExceptionFilter } from '../exception-filters/prisma/prisma.filter';

@Controller('lessons')
export class LessonsController {
  constructor(
    private readonly lessonsService: LessonsService,
    private readonly s3Service: S3Service,
  ) {}
  @Post('create/:moduleId')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'video', maxCount: 1 },
        {
          name: 'attachedFiles',
          maxCount: 5,
        },
      ],
      { storage: STORAGE },
    ),
  )
  @UseFilters(PrismaClientExceptionFilter)
  async create(
    @Param('moduleId') moduleId: string,
    @Body() createLessonDto: Prisma.LessonsCreateInput,
    @UploadedFiles()
    files: {
      video: Express.Multer.File[];
      attachedFiles?: Express.Multer.File[];
    },
  ) {
    const video = files.video[0];
    const attachedFiles = files?.attachedFiles;

    if (!video) {
      throw new BadRequestException('video is required');
    }

    if (attachedFiles) {
      createLessonDto.attachedFiles = await Promise.all([
        ...attachedFiles?.map((file) => this.s3Service.upload(file)),
      ]);
    }

    createLessonDto.video = await this.s3Service.upload(video);

    return await this.lessonsService.create(moduleId, createLessonDto);
  }

  @Get('single/:id')
  @UseFilters(PrismaClientExceptionFilter)
  async findOne(@Param('id') id: string) {
    return await this.lessonsService.findOne(id);
  }

  @Patch('update/:id')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'video', maxCount: 1 },
        {
          name: 'attachedFiles',
          maxCount: 5,
        },
      ],
      { storage: STORAGE },
    ),
  )
  @UseFilters(PrismaClientExceptionFilter)
  async update(
    @Body() updateLessonDto: Prisma.LessonsUpdateInput,
    @Param('id') id: string,
    @UploadedFiles()
    files: {
      video?: Express.Multer.File[];
      attachedFiles?: Express.Multer.File[];
    },
  ) {
    const video = files?.video[0];
    const attachedFiles = files?.attachedFiles;

    if (video) {
      updateLessonDto.video = await this.s3Service.upload(video);
    }

    if (attachedFiles) {
      updateLessonDto.attachedFiles = await Promise.all([
        ...attachedFiles?.map((file) => this.s3Service.upload(file)),
      ]);
    }

    return await this.lessonsService.update(id, updateLessonDto);
  }

  @Delete('delete/:id')
  @UseFilters(PrismaClientExceptionFilter)
  async delete(@Param('id') id: string) {
    return await this.lessonsService.remove(id);
  }
}
