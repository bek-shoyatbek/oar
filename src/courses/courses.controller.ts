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
  ValidationPipe,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { Prisma } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import { STORAGE } from 'src/users/constants/storage';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { getImageValidator } from 'src/utils/custom-validators/image-validator/image-validator';
import { ValidateObjectIdDto } from './dto/validate-objectId.dto';

@Controller('courses')
export class CoursesController {
  constructor(
    private readonly coursesService: CoursesService,
    private cloudinary: CloudinaryService,
  ) {}
  @UseInterceptors(FileInterceptor('image', { storage: STORAGE }))
  @Post('create')
  @UsePipes(
    new ValidationPipe({
      transform: true,
    }),
  )
  async create(
    @Body() createCourseDto: Prisma.CourseCreateInput,
    @UploadedFile(getImageValidator()) image: Express.Multer.File,
  ) {
    if (!image) {
      throw new BadRequestException('image is required');
    }
    const uploadToCDNResult = await this.cloudinary.upload(image);
    if (uploadToCDNResult?.error) {
      throw new BadRequestException(uploadToCDNResult.error);
    }

    createCourseDto.image = uploadToCDNResult.url;

    return await this.coursesService.create(createCourseDto);
  }

  @UseInterceptors(FileInterceptor('image', { storage: STORAGE }))
  @Patch('update/:id')
  async update(
    @Param('id') id: string,
    @Body() updateCourseDto: Prisma.CourseUpdateInput,
    @UploadedFile(getImageValidator()) image: Express.Multer.File,
  ) {
    if (image) {
      const uploadToCDNResult = await this.cloudinary.upload(image);
      if (uploadToCDNResult?.error) {
        throw new BadRequestException(uploadToCDNResult.error);
      }

      updateCourseDto.image = uploadToCDNResult.url;
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
