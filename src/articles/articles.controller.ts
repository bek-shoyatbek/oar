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
  UseInterceptors,
} from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Prisma } from '@prisma/client';
import { S3Service } from 'src/aws/s3/s3.service';
import { PrismaClientExceptionFilter } from 'src/exception-filters/prisma/prisma.filter';

@Controller('articles')
export class ArticlesController {
  constructor(
    private readonly articlesService: ArticlesService,
    private readonly s3Service: S3Service,
  ) {}
  @Post('create')
  @UseInterceptors(FilesInterceptor('images'))
  @UseFilters(PrismaClientExceptionFilter)
  async create(
    @UploadedFiles() images: Express.Multer.File[],
    @Body() createArticleDto: Prisma.ArticlesCreateInput,
  ) {
    if (!images || images.length < 2) {
      throw new BadRequestException('images are required');
    }

    const [imageWebURL, imageMobileURL] = await Promise.all(
      images.map(async (image) => await this.s3Service.upload(image)),
    );

    createArticleDto.imageWeb = imageWebURL;

    createArticleDto.imageMobile = imageMobileURL;

    return await this.articlesService.create(createArticleDto);
  }

  @Patch('update/:id')
  @UseFilters(PrismaClientExceptionFilter)
  @UseInterceptors(FilesInterceptor('images'))
  async update(
    @Body() updateArticleDto: Prisma.ArticlesUpdateInput,
    @UploadedFiles() images: Express.Multer.File[],
    @Param('id') id: string,
  ) {
    if (images && images.length == 2) {
      const [imageWebURL, imageMobileURL] = await Promise.all(
        images.map(async (image) => await this.s3Service.upload(image)),
      );

      updateArticleDto.imageWeb = imageWebURL;

      updateArticleDto.imageMobile = imageMobileURL;
    }
    return await this.articlesService.update(id, updateArticleDto);
  }

  @Get('all')
  @UseFilters(PrismaClientExceptionFilter)
  async findAll(
    @Query('isPublished', new ParseBoolPipe({ optional: true }))
    isPublished: boolean,
  ) {
    return await this.articlesService.findAll(isPublished);
  }

  @Get('single/:id')
  @UseFilters(PrismaClientExceptionFilter)
  async findOne(@Param('id') id: string) {
    return await this.articlesService.findOne(id);
  }

  @Delete('remove/:id')
  @UseFilters(PrismaClientExceptionFilter)
  async remove(@Param('id') id: string) {
    return await this.articlesService.remove(id);
  }
}
