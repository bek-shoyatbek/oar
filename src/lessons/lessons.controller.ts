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
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { STORAGE } from 'src/constants/storage';
import { Prisma } from '@prisma/client';
import { S3Service } from 'src/aws/s3/s3.service';
import { PrismaClientExceptionFilter } from '../exception-filters/prisma/prisma.filter';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { Public } from 'src/decorators/public.decorator';

@Controller('lessons')
export class LessonsController {
  constructor(
    private readonly lessonsService: LessonsService,
    private readonly s3Service: S3Service,
  ) {}
  @Post('create/:moduleId')
  @Roles('admin')
  @UseGuards(RolesGuard)
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
  @Public()
  @UseFilters(PrismaClientExceptionFilter)
  async findOne(@Param('id') id: string) {
    return await this.lessonsService.findOne(id);
  }

  @Patch('update/:id')
  @Roles('admin')
  @UseGuards(RolesGuard)
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
    if (files?.video) {
      updateLessonDto.video = await this.s3Service.upload(files.video[0]);
    }

    if (files?.attachedFiles) {
      updateLessonDto.attachedFiles = await Promise.all([
        ...files?.attachedFiles?.map((file) => this.s3Service.upload(file)),
      ]);
    }

    return await this.lessonsService.update(id, updateLessonDto);
  }

  @Delete('delete/:id')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @UseFilters(PrismaClientExceptionFilter)
  async delete(@Param('id') id: string) {
    return await this.lessonsService.remove(id);
  }
}
