import { Controller, Delete, Patch, Post } from '@nestjs/common';
import { ModulesService } from './modules.service';

@Controller('modules')
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}
  @Post('create')
  async create() {}

  @Patch('update/:id')
  async update() {}

  @Delete('delete/:id')
  async delete() {}
}
