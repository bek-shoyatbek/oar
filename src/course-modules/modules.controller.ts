import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseFilters,
} from '@nestjs/common';
import { ModulesService } from './modules.service';
import { Prisma } from '@prisma/client';

import { ValidateObjectIdDto } from 'src/courses/dto/validate-objectId.dto';
import { PrismaClientExceptionFilter } from '../exception-filters/prisma/prisma.filter';

@Controller('modules')
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}
  @Post('create/:courseId')
  @UseFilters(PrismaClientExceptionFilter)
  async create(
    @Param('courseId') courseId: string,
    @Body() createModuleDto: Prisma.ModulesCreateInput,
  ) {
    return await this.modulesService.create(courseId, createModuleDto);
  }

  @Get('single/:id')
  @UseFilters(PrismaClientExceptionFilter)
  async findOne(@Param() params: ValidateObjectIdDto) {
    return await this.modulesService.findOne(params.id);
  }
  @Patch('update/:id')
  @UseFilters(PrismaClientExceptionFilter)
  async update(
    @Body() updateModuleDto: Prisma.ModulesUpdateInput,
    @Param('id') id: string,
  ) {
    return await this.modulesService.update(id, updateModuleDto);
  }

  @Delete('delete/:id')
  @UseFilters(PrismaClientExceptionFilter)
  async delete(@Param('id') id: string) {
    return await this.modulesService.remove(id);
  }
}
