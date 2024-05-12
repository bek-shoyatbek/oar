import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class PlansService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createPlanDto: Prisma.PlansCreateInput, courseId: string) {
    return await this.prismaService.plans.create({
      data: {
        ...createPlanDto,
        available_period: +createPlanDto.available_period,
        courseId,
        price: +createPlanDto.price,
      },
    });
  }

  async update(id: string, updatePlanDto: Prisma.PlansUpdateInput) {
    return await this.prismaService.plans.update({
      where: { id },
      data: updatePlanDto,
    });
  }

  async delete(id: string) {
    return await this.prismaService.plans.delete({ where: { id } });
  }

  async findAll(courseId: string) {
    return await this.prismaService.plans.findMany({
      where: { courseId: { equals: courseId } },
    });
  }
}
