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
  UseFilters,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { Prisma } from '@prisma/client';

import { PrismaClientExceptionFilter } from '../exception-filters/prisma/prisma.filter';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post('create')
  @UseFilters(PrismaClientExceptionFilter)
  async create(@Body() createCommentDto: Prisma.CommentsCreateInput) {
    return await this.commentsService.create(createCommentDto);
  }

  @Patch('update/:id')
  @UseFilters(PrismaClientExceptionFilter)
  async update(
    @Param('id') id: string,
    @Body() updateCommentDto: Prisma.CommentsUpdateInput,
  ) {
    return await this.commentsService.update(id, updateCommentDto);
  }

  @Delete('delete/:id')
  @UseFilters(PrismaClientExceptionFilter)
  async delete(@Param('id') id: string) {
    return await this.commentsService.remove(id);
  }

  @Get('all')
  @UseFilters(PrismaClientExceptionFilter)
  async findAll(
    @Query('isPublished', new ParseBoolPipe({ optional: true }))
    isPublished: boolean,
  ) {
    return await this.commentsService.findAll(isPublished);
  }
}
