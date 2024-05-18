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
import { ArticlesService } from './articles.service';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Prisma } from '@prisma/client';
import { S3Service } from 'src/aws/s3/s3.service';
import { PrismaClientExceptionFilter } from 'src/exception-filters/prisma/prisma.filter';
import { STORAGE } from '../constants/storage';
import { Roles } from 'src/decorators/roles.decorator';
import { Public } from 'src/decorators/public.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Controller('articles')
export class ArticlesController {
  constructor(
    private readonly articlesService: ArticlesService,
    private readonly s3Service: S3Service,
  ) {}

  @Post('create')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'articleImage', maxCount: 1 },
        {
          name: 'bannerImageWeb',
          maxCount: 1,
        },
        {
          name: 'bannerImageMobile',
          maxCount: 1,
        },
      ],
      { storage: STORAGE },
    ),
  )
  @UseFilters(PrismaClientExceptionFilter)
  async create(
    @UploadedFiles()
    files: {
      articleImage: Express.Multer.File[];
      bannerImageWeb: Express.Multer.File[];
      bannerImageMobile: Express.Multer.File[];
    },
    @Body() createArticleDto: Prisma.ArticlesCreateInput,
  ) {
    const articleImage = files.articleImage[0];
    const bannerImageWeb = files.bannerImageWeb[0];
    const bannerImageMobile = files.bannerImageMobile[0];

    if (!articleImage || !bannerImageMobile || !bannerImageWeb) {
      throw new BadRequestException(
        'articleImage,bannerImageWeb and mobile are required',
      );
    }

    const filesToUpload = [
      this.s3Service.upload(articleImage),
      this.s3Service.upload(bannerImageWeb),
      this.s3Service.upload(bannerImageMobile),
    ];

    const [articleImageURL, bannerImageWebURL, bannerImageMobileURL] =
      await Promise.all(filesToUpload);

    createArticleDto.articleImage = articleImageURL;

    createArticleDto.imageWeb = bannerImageWebURL;

    createArticleDto.imageMobile = bannerImageMobileURL;

    return await this.articlesService.create(createArticleDto);
  }

  @Patch('update/:id')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @UseFilters(PrismaClientExceptionFilter)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'articleImage', maxCount: 1 },
        {
          name: 'bannerImageWeb',
          maxCount: 1,
        },
        {
          name: 'bannerImageMobile',
          maxCount: 1,
        },
      ],
      { storage: STORAGE },
    ),
  )
  async update(
    @Body() updateArticleDto: Prisma.ArticlesUpdateInput,
    @UploadedFiles()
    files: {
      articleImage?: Express.Multer.File[];
      bannerImageWeb?: Express.Multer.File[];
      bannerImageMobile?: Express.Multer.File[];
    },
    @Param('id') id: string,
  ) {
    const articleImage = files?.articleImage && files?.articleImage[0];
    const bannerImageWeb = files.bannerImageWeb && files.bannerImageWeb[0];
    const bannerImageMobile =
      files.bannerImageMobile && files.bannerImageMobile[0];

    if (articleImage) {
      updateArticleDto.articleImage = await this.s3Service.upload(articleImage);
    }

    if (bannerImageWeb) {
      updateArticleDto.imageWeb = await this.s3Service.upload(bannerImageWeb);
    }

    if (bannerImageMobile) {
      updateArticleDto.imageMobile =
        await this.s3Service.upload(bannerImageMobile);
    }

    return await this.articlesService.update(id, updateArticleDto);
  }

  @Get('all')
  @Public()
  @UseFilters(PrismaClientExceptionFilter)
  async findAll(
    @Query('isPublished', new ParseBoolPipe({ optional: true }))
    isPublished: boolean,
  ) {
    return await this.articlesService.findAll(isPublished);
  }

  @Get('single/:id')
  @Public()
  @UseFilters(PrismaClientExceptionFilter)
  async findOne(@Param('id') id: string) {
    return await this.articlesService.findOne(id);
  }

  @Delete('remove/:id')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @UseFilters(PrismaClientExceptionFilter)
  async remove(@Param('id') id: string) {
    return await this.articlesService.remove(id);
  }
}
