import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { PlansService } from './plans.service';
import { Prisma } from '@prisma/client';

@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Post('create/:courseId')
  async create(
    @Body() createPlanDto: Prisma.PlansCreateInput,
    @Param('courseId') courseId: string,
  ) {
    return await this.plansService.create(createPlanDto, courseId);
  }

  @Patch('update/:id')
  async update(
    @Body() updatePlanDto: Prisma.PlansUpdateInput,
    @Param('id') id: string,
  ) {
    return await this.plansService.update(id, updatePlanDto);
  }

  @Delete('delete/:id')
  async delete(@Param('id') id: string) {
    return await this.plansService.delete(id);
  }

  @Get('all/:courseId')
  async getAll(@Param('courseId') courseId: string) {
    return await this.plansService.findAll(courseId);
  }
}
