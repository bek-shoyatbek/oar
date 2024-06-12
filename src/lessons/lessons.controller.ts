import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
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
        { name: 'videoUz', maxCount: 1 },
        { name: 'videoRu', maxCount: 1 },
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
      videoUz: Express.Multer.File[];
      videoRu: Express.Multer.File[];
      attachedFiles?: Express.Multer.File[];
    },
  ) {
    const videoUz = files.videoUz[0];
    const videoRu = files.videoRu[0];
    const attachedFiles = files?.attachedFiles;

    if (!videoUz || !videoRu) {
      throw new BadRequestException('video in uz and ru are required');
    }

    if (attachedFiles) {
      createLessonDto.attachedFiles = await Promise.all([
        ...attachedFiles?.map((file) => this.s3Service.upload(file)),
      ]);
    }

    createLessonDto.videoUz = await this.s3Service.upload(videoUz);

    createLessonDto.videoRu = await this.s3Service.upload(videoRu);

    return await this.lessonsService.create(moduleId, createLessonDto);
  }

  @Get('single/:id')
  @UseFilters(PrismaClientExceptionFilter)
  async findOne(@Request() req, @Param('id') id: string) {
    const user = { userId: req?.user?.userId, role: req?.user?.role };
    return await this.lessonsService.findOne(id, user);
  }

  @Patch('update/:id')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'videoUz', maxCount: 1 },
        { name: 'videoRu', maxCount: 1 },
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
      videoUz?: Express.Multer.File[];
      videoRu?: Express.Multer.File[];
      attachedFiles?: Express.Multer.File[];
    },
  ) {
    if (files?.videoUz) {
      updateLessonDto.videoUz = await this.s3Service.upload(files.videoUz[0]);
    }

    if (files?.videoRu) {
      updateLessonDto.videoRu = await this.s3Service.upload(files.videoRu[0]);
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
