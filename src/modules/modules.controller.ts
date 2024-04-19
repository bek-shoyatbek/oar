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
import { ModulesService } from './modules.service';
import { Prisma } from '@prisma/client';
import { getImageValidator } from 'src/utils/custom-validators/image-validator/image-validator';
import { FileInterceptor } from '@nestjs/platform-express';
import { STORAGE } from 'src/constants/storage';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { ValidateObjectIdDto } from 'src/courses/dto/validate-objectId.dto';
import { S3Service } from 'src/aws/s3/s3.service';

@Controller('modules')
export class ModulesController {
  constructor(
    private readonly modulesService: ModulesService,
    private cloudinary: CloudinaryService,
    private readonly s3Service: S3Service,
  ) {}
  @Post('create/:courseId')
  @UseInterceptors(FileInterceptor('image', { storage: STORAGE }))
  async create(
    @Param('courseId') courseId: string,
    @Body() createModuleDto: Prisma.ModuleCreateInput,
    @UploadedFile(getImageValidator()) image: Express.Multer.File,
  ) {
    if (!image) {
      throw new BadRequestException('image is required');
    }
    const fileUrl = await this.s3Service.upload(image);
    createModuleDto.image = fileUrl;

    return await this.modulesService.create(courseId, createModuleDto);
  }

  @Get('single/:id')
  async findOne(@Param() params: ValidateObjectIdDto) {
    return await this.modulesService.findOne(params.id);
  }
  @Patch('update/:id')
  @UseInterceptors(FileInterceptor('image', { storage: STORAGE }))
  async update(
    @Body() updateModuleDto: Prisma.ModuleUpdateInput,
    @Param('id') id: string,
    @UploadedFile(getImageValidator()) image: Express.Multer.File,
  ) {
    if (image) {
      const fileUrl = await this.s3Service.upload(image);
      updateModuleDto.image = fileUrl;
    }

    return await this.modulesService.update(id, updateModuleDto);
  }

  @Delete('delete/:id')
  async delete(@Param('id') id: string) {
    return await this.modulesService.remove(id);
  }
}
