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
  Request,
  UploadedFile,
  UseFilters,
  UseGuards,
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
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { Public } from 'src/decorators/public.decorator';
import { ObjectId } from 'mongodb';

@Controller('courses')
export class CoursesController {
  constructor(
    private readonly coursesService: CoursesService,
    private readonly s3Service: S3Service,
  ) {}
  @Post('create')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @UseInterceptors(FileInterceptor('image', { storage: STORAGE }))
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

  @Patch('update/:id')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @UseInterceptors(FileInterceptor('image', { storage: STORAGE }))
  @UseFilters(PrismaClientExceptionFilter)
  async update(
    @Param('id') id: string,
    @Body() updateCourseDto: Prisma.CoursesUpdateInput,
    @UploadedFile(getImageValidator()) image: Express.Multer.File,
  ) {
    if (image) {
      updateCourseDto.image = await this.s3Service.upload(image);
    }

    if (!ObjectId.isValid(id)) {
      throw new BadRequestException('Course id is invalid');
    }

    return await this.coursesService.update(id, updateCourseDto);
  }

  @Get('all')
  @Public()
  @UseFilters(PrismaClientExceptionFilter)
  async findAll(
    @Query('status') courseStatus?: 'completed' | 'inProgress' | 'archived',
  ) {
    return await this.coursesService.findAll(courseStatus);
  }

  @Get('my-courses')
  @UseFilters(PrismaClientExceptionFilter)
  async myCourses(@Request() req) {
    const userId = req?.user?.userId;
    return await this.coursesService.getMyCourses(userId);
  }
  @Get('single/:id')
  @Public()
  @UseFilters(PrismaClientExceptionFilter)
  async findOne(@Param() params: ValidateObjectIdDto) {
    if (!ObjectId.isValid(params?.id)) {
      throw new BadRequestException('Course id is invalid');
    }

    return await this.coursesService.findOne(params.id);
  }

  @Delete('remove/:id')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @UseFilters(PrismaClientExceptionFilter)
  async delete(@Param('id') id: string) {
    if (!ObjectId.isValid(id)) {
      throw new BadRequestException('Course id is invalid');
    }
    return await this.coursesService.remove(id);
  }
}
