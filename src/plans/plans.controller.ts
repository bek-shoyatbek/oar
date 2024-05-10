import { Body, Controller, Delete, Get, Param, Patch, Post, UseFilters } from "@nestjs/common";
import { PlansService } from "./plans.service";
import { Prisma } from "@prisma/client";
import { PrismaClientExceptionFilter } from "../exception-filters/prisma/prisma.filter";

@Controller("plans")
export class PlansController {
  constructor(private readonly plansService: PlansService) {
  }

  @Post("create/:courseId")
  @UseFilters(PrismaClientExceptionFilter)
  async create(
    @Body() createPlanDto: Prisma.PlansCreateInput,
    @Param("courseId") courseId: string
  ) {
    return await this.plansService.create(createPlanDto, courseId);
  }

  @Patch("update/:id")
  @UseFilters(PrismaClientExceptionFilter)
  async update(
    @Body() updatePlanDto: Prisma.PlansUpdateInput,
    @Param("id") id: string
  ) {
    return await this.plansService.update(id, updatePlanDto);
  }

  @Delete("delete/:id")
  @UseFilters(PrismaClientExceptionFilter)
  async delete(@Param("id") id: string) {
    return await this.plansService.delete(id);
  }

  @Get("all/:courseId")
  @UseFilters(PrismaClientExceptionFilter)
  async getAll(@Param("courseId") courseId: string) {
    return await this.plansService.findAll(courseId);
  }
}
