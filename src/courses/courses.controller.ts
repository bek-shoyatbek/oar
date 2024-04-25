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
  UsePipes,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { Prisma } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import { STORAGE } from 'src/constants/storage';
import { getImageValidator } from 'src/utils/custom-validators/image-validator/image-validator';
import { ValidateObjectIdDto } from './dto/validate-objectId.dto';
import { S3Service } from 'src/aws/s3/s3.service';

@Controller('courses')
export class CoursesController {
  constructor(
    private readonly coursesService: CoursesService,
    private readonly s3Service: S3Service,
  ) {}
  @UseInterceptors(FileInterceptor('image', { storage: STORAGE }))
  @Post('create')
  @UsePipes()
  async create(
    @Body() createCourseDto: Prisma.CoursesCreateInput,
    @UploadedFile(getImageValidator()) image: Express.Multer.File,
  ) {
    if (!image) {
      throw new BadRequestException('image is required');
    }

    const fileUrl = await this.s3Service.upload(image);

    createCourseDto.image = fileUrl;

    return await this.coursesService.create(createCourseDto);
  }

  @UseInterceptors(FileInterceptor('image', { storage: STORAGE }))
  @Patch('update/:id')
  async update(
    @Param('id') id: string,
    @Body() updateCourseDto: Prisma.CoursesUpdateInput,
    @UploadedFile(getImageValidator()) image: Express.Multer.File,
  ) {
    if (image) {
      const fileUrl = await this.s3Service.upload(image);

      updateCourseDto.image = fileUrl;
    }

    return await this.coursesService.update(id, updateCourseDto);
  }

  @Get('all')
  async findAll() {
    return await this.coursesService.findAll();
  }

  @Get('single/:id')
  async findOne(@Param() params: ValidateObjectIdDto) {
    return await this.coursesService.findOne(params.id);
  }

  @Delete('remove/:id')
  async delete(@Param('id') id: string) {}
}
