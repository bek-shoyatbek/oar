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
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Prisma } from '@prisma/client';
import { S3Service } from 'src/aws/s3/s3.service';

@Controller('articles')
export class ArticlesController {
  constructor(
    private readonly articlesService: ArticlesService,
    private readonly s3Service: S3Service,
  ) {}
  @Post('create')
  @UseInterceptors(FilesInterceptor('images'))
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
  async findAll(@Query('isPublished') isPublished: boolean) {
    return await this.articlesService.findAll(isPublished);
  }

  @Get('single/:id')
  async findOne(@Param('id') id: string) {
    return await this.articlesService.findOne(id);
  }

  @Delete('remove/:id')
  async remove(@Param('id') id: string) {
    return await this.articlesService.remove(id);
  }
}
