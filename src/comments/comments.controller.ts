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
  UseGuards,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { Prisma } from '@prisma/client';
import { PrismaClientExceptionFilter } from '../exception-filters/prisma/prisma.filter';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Public } from 'src/decorators/public.decorator';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post('create')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @UseFilters(PrismaClientExceptionFilter)
  async create(@Body() createCommentDto: Prisma.CommentsCreateInput) {
    return await this.commentsService.create(createCommentDto);
  }

  @Patch('update/:id')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @UseFilters(PrismaClientExceptionFilter)
  async update(
    @Param('id') id: string,
    @Body() updateCommentDto: Prisma.CommentsUpdateInput,
  ) {
    return await this.commentsService.update(id, updateCommentDto);
  }

  @Delete('delete/:id')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @UseFilters(PrismaClientExceptionFilter)
  async delete(@Param('id') id: string) {
    return await this.commentsService.remove(id);
  }

  @Get('all')
  @Public()
  @UseFilters(PrismaClientExceptionFilter)
  async findAll(
    @Query('isPublished', new ParseBoolPipe({ optional: true }))
    isPublished: boolean,
  ) {
    return await this.commentsService.findAll(isPublished);
  }
}
