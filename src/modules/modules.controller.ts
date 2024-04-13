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
import { STORAGE } from 'src/users/constants/storage';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { ValidateObjectIdDto } from 'src/courses/dto/validate-objectId.dto';

@Controller('modules')
export class ModulesController {
  constructor(
    private readonly modulesService: ModulesService,
    private cloudinary: CloudinaryService,
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
    const uploadToCDNResult = await this.cloudinary.upload(image, 'image');
    if (uploadToCDNResult?.error) {
      throw new BadRequestException(uploadToCDNResult.error);
    }

    createModuleDto.image = uploadToCDNResult.url;
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
      const uploadToCDNResult = await this.cloudinary.upload(image, 'image');
      if (uploadToCDNResult?.error) {
        throw new BadRequestException(uploadToCDNResult.error);
      }

      updateModuleDto.image = uploadToCDNResult.url;
    }

    return await this.modulesService.update(id, updateModuleDto);
  }

  @Delete('delete/:id')
  async delete(@Param('id') id: string) {
    return await this.modulesService.remove(id);
  }
}
