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
import { PlansService } from './plans.service';
import { Prisma } from '@prisma/client';
import { PrismaClientExceptionFilter } from '../exception-filters/prisma/prisma.filter';
import { Roles } from 'src/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Public } from 'src/decorators/public.decorator';

@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Post('create/:courseId')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @UseFilters(PrismaClientExceptionFilter)
  async create(
    @Body() createPlanDto: Prisma.PlansCreateInput,
    @Param('courseId') courseId: string,
  ) {
    return await this.plansService.create(createPlanDto, courseId);
  }

  @Patch('update/:id')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @UseFilters(PrismaClientExceptionFilter)
  async update(
    @Body() updatePlanDto: Prisma.PlansUpdateInput,
    @Param('id') id: string,
  ) {
    return await this.plansService.update(id, updatePlanDto);
  }

  @Delete('delete/:id')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @UseFilters(PrismaClientExceptionFilter)
  async delete(@Param('id') id: string) {
    return await this.plansService.delete(id);
  }

  @Get('all/:courseId')
  @Public()
  @UseFilters(PrismaClientExceptionFilter)
  async getAll(@Param('courseId') courseId: string) {
    return await this.plansService.findAll(courseId);
  }
}
