import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { StaticsService } from './statics.service';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { STORAGE } from 'src/constants/storage';
import { Prisma } from '@prisma/client';
import { PrismaClientExceptionFilter } from 'src/exception-filters/prisma/prisma.filter';
import { Public } from 'src/decorators/public.decorator';
import { S3Service } from 'src/aws/s3/s3.service';

@Controller('statics')
export class StaticsController {
  constructor(
    private readonly staticsService: StaticsService,
    private readonly s3Service: S3Service,
  ) {}

  @Post('create')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @UseInterceptors(FileInterceptor('file', { storage: STORAGE }))
  @UseFilters(PrismaClientExceptionFilter)
  async uploadFile(
    @Body() uploadFileDto: Prisma.StaticsCreateInput,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (file) {
      uploadFileDto.file = await this.s3Service.upload(file);
    }

    return await this.staticsService.uploadFile(uploadFileDto);
  }

  @Get('all')
  @Public()
  async getAll() {
    return this.staticsService.getAll();
  }

  @Get(':id')
  @Public()
  async getOne(@Param('id') id: string) {
    return this.staticsService.getById(id);
  }

  @Get('idx/:idx')
  @Public()
  async getOneByIndex(@Param('idx') idx: string) {
    return this.staticsService.getByIdx(idx);
  }

  @Patch(':id')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @UseInterceptors(FileInterceptor('file', { storage: STORAGE }))
  @UseFilters(PrismaClientExceptionFilter)
  async update(
    @Param('id') id: string,
    @Body() updateDto: Prisma.StaticsUpdateInput,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (file) {
      updateDto.file = await this.s3Service.upload(file);
    }

    return await this.staticsService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles('admin')
  @UseGuards(RolesGuard)
  async delete(@Param('id') id: string) {
    return await this.staticsService.remove(id);
  }
}
