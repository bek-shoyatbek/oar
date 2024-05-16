import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseBoolPipe,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { BannersService } from './banners.service';
import { Prisma } from '@prisma/client';
import { FilesInterceptor } from '@nestjs/platform-express';
import { S3Service } from 'src/aws/s3/s3.service';
import { PrismaClientExceptionFilter } from '../exception-filters/prisma/prisma.filter';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Public } from 'src/decorators/public.decorator';

@Controller('banners')
export class BannersController {
  constructor(
    private readonly bannersService: BannersService,
    private readonly s3Service: S3Service,
  ) {}

  @Post('create')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @UseInterceptors(FilesInterceptor('images'))
  @UseFilters(PrismaClientExceptionFilter)
  async create(
    @Body() createBannerDto: Prisma.BannersCreateInput,
    @UploadedFiles() images: Express.Multer.File[],
  ) {
    if (!images || images.length < 2) {
      throw new BadRequestException('images are required');
    }

    const [imageWebURL, imageMobileURL] = await Promise.all(
      images.map(async (image) => await this.s3Service.upload(image)),
    );

    createBannerDto.imageWeb = imageWebURL;

    createBannerDto.imageMobile = imageMobileURL;

    return await this.bannersService.create(createBannerDto);
  }

  @Patch('update/:id')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @UseInterceptors(FilesInterceptor('images'))
  @UseFilters(PrismaClientExceptionFilter)
  async update(
    @UploadedFiles() images: Express.Multer.File[],
    @Param('id') id: string,
    @Body() updateBannerDto: Prisma.BannersUpdateInput,
  ) {
    if (images && images.length == 2) {
      const [imageWebURL, imageMobileURL] = await Promise.all(
        images.map(async (image) => await this.s3Service.upload(image)),
      );

      updateBannerDto.imageWeb = imageWebURL;
      updateBannerDto.imageMobile = imageMobileURL;
    }
    return await this.bannersService.update(id, updateBannerDto);
  }

  @Delete('delete/:id')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @UseFilters(PrismaClientExceptionFilter)
  async delete(@Param('id') id: string) {
    return await this.bannersService.remove(id);
  }

  @Get('all')
  @Public()
  @UseFilters(PrismaClientExceptionFilter)
  async findAll(
    @Query('isPublished', new ParseBoolPipe({ optional: true }))
    isPublished: boolean,
  ) {
    return await this.bannersService.findAll(isPublished);
  }

  @Get('single/:id')
  @Public()
  @UseFilters(PrismaClientExceptionFilter)
  async findOne(@Param('id') id: string) {
    return await this.bannersService.findOne(id);
  }
}
