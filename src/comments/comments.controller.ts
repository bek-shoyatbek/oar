import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseBoolPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { Prisma } from '@prisma/client';
import { S3Service } from 'src/aws/s3/s3.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('comments')
export class CommentsController {
  constructor(
    private readonly commentsService: CommentsService,
    private readonly s3Service: S3Service,
  ) {}

  @Post('create')
  @UseInterceptors(FileInterceptor('userAvatar'))
  async create(
    @Body() createCommentDto: Prisma.CommentsCreateInput,
    @UploadedFile() image: Express.Multer.File,
  ) {
    if (image) {
      const fileUrl = await this.s3Service.upload(image);
      createCommentDto.userAvatar = fileUrl;
    }
    return await this.commentsService.create(createCommentDto);
  }

  @Patch('update/:id')
  @UseInterceptors(FileInterceptor('userAvatar'))
  async update(
    @Param('id') id: string,
    @Body() updateCommentDto: Prisma.CommentsUpdateInput,
    @UploadedFile() image: Express.Multer.File,
  ) {
    if (image) {
      const fileUrl = await this.s3Service.upload(image);
      updateCommentDto.userAvatar = fileUrl;
    }
    return await this.commentsService.update(id, updateCommentDto);
  }

  @Delete('delete/:id')
  async delete(@Param('id') id: string) {
    return await this.commentsService.remove(id);
  }

  @Get('all')
  async findAll(
    @Query('isPublished', new ParseBoolPipe({ optional: true }))
    isPublished: boolean,
  ) {
    return await this.commentsService.findAll(isPublished);
  }
}
