import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ModulesService } from './modules.service';
import { Prisma } from '@prisma/client';

import { ValidateObjectIdDto } from 'src/courses/dto/validate-objectId.dto';

@Controller('modules')
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}
  @Post('create/:courseId')
  async create(
    @Param('courseId') courseId: string,
    @Body() createModuleDto: Prisma.ModulesCreateInput,
  ) {
    return await this.modulesService.create(courseId, createModuleDto);
  }

  @Get('single/:id')
  async findOne(@Param() params: ValidateObjectIdDto) {
    return await this.modulesService.findOne(params.id);
  }
  @Patch('update/:id')
  async update(
    @Body() updateModuleDto: Prisma.ModulesUpdateInput,
    @Param('id') id: string,
  ) {
    return await this.modulesService.update(id, updateModuleDto);
  }

  @Delete('delete/:id')
  async delete(@Param('id') id: string) {
    return await this.modulesService.remove(id);
  }
}
