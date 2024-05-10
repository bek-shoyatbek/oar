import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { Prisma } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import { STORAGE } from 'src/constants/storage';
import { getImageValidator } from 'src/utils/custom-validators/image-validator/image-validator';
import { ValidateObjectIdDto } from './dto/validate-objectId.dto';
import { S3Service } from 'src/aws/s3/s3.service';
import { PrismaClientExceptionFilter } from '../exception-filters/prisma/prisma.filter';

@Controller('courses')
export class CoursesController {
  constructor(
    private readonly coursesService: CoursesService,
    private readonly s3Service: S3Service,
  ) {}
  @UseInterceptors(FileInterceptor('image', { storage: STORAGE }))
  @Post('create')
  @UseFilters(PrismaClientExceptionFilter)
  async create(
    @Body() createCourseDto: Prisma.CoursesCreateInput,
    @UploadedFile(getImageValidator()) image: Express.Multer.File,
  ) {
    if (!image) {
      throw new BadRequestException('image is required');
    }

    createCourseDto.image = await this.s3Service.upload(image);

    return await this.coursesService.create(createCourseDto);
  }

  @UseInterceptors(FileInterceptor('image', { storage: STORAGE }))
  @Patch('update/:id')
  @UseFilters(PrismaClientExceptionFilter)
  async update(
    @Param('id') id: string,
    @Body() updateCourseDto: Prisma.CoursesUpdateInput,
    @UploadedFile(getImageValidator()) image: Express.Multer.File,
  ) {
    if (image) {
      updateCourseDto.image = await this.s3Service.upload(image);
    }

    return await this.coursesService.update(id, updateCourseDto);
  }

  @Get('all')
  @UseFilters(PrismaClientExceptionFilter)
  async findAll(
    @Query('status') courseStatus?: 'completed' | 'inProgress' | 'archived',
  ) {
    return await this.coursesService.findAll(courseStatus);
  }

  @Get('single/:id')
  @UseFilters(PrismaClientExceptionFilter)
  async findOne(@Param() params: ValidateObjectIdDto) {
    return await this.coursesService.findOne(params.id);
  }

  @Delete('remove/:id')
  @UseFilters(PrismaClientExceptionFilter)
  async delete(@Param('id') id: string) {
    return await this.coursesService.remove(id);
  }
}
