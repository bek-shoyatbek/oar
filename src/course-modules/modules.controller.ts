import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { ModulesService } from './modules.service';
import { Prisma } from '@prisma/client';

import { ValidateObjectIdDto } from 'src/courses/dto/validate-objectId.dto';
import { PrismaClientExceptionFilter } from '../exception-filters/prisma/prisma.filter';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { Public } from 'src/decorators/public.decorator';

@Controller('modules')
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}
  @Post('create/:courseId')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @UseFilters(PrismaClientExceptionFilter)
  async create(
    @Param('courseId') courseId: string,
    @Body() createModuleDto: Prisma.ModulesCreateInput,
  ) {
    return await this.modulesService.create(courseId, createModuleDto);
  }

  @Get('single/:id')
  @Public()
  @UseFilters(PrismaClientExceptionFilter)
  async findOne(@Param() params: ValidateObjectIdDto) {
    return await this.modulesService.findOne(params.id);
  }
  @Patch('update/:id')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @UseFilters(PrismaClientExceptionFilter)
  async update(
    @Body() updateModuleDto: Prisma.ModulesUpdateInput,
    @Param('id') id: string,
  ) {
    return await this.modulesService.update(id, updateModuleDto);
  }

  @Delete('delete/:id')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @UseFilters(PrismaClientExceptionFilter)
  async delete(@Param('id') id: string) {
    return await this.modulesService.remove(id);
  }
}
