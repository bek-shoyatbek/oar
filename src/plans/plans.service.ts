import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class PlansService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createPlanDto: Prisma.PlansCreateInput, courseId: string) {
    createPlanDto = this.transformData(createPlanDto);
    return await this.prismaService.plans.create({
      data: {
        ...createPlanDto,
        availablePeriod: +createPlanDto.availablePeriod,
        courseId,
        price: +createPlanDto.price,
      },
    });
  }

  async update(id: string, updatePlanDto: Prisma.PlansUpdateInput) {
    updatePlanDto = this.transformData(updatePlanDto);
    return await this.prismaService.plans.update({
      where: { id },
      data: updatePlanDto,
    });
  }

  async delete(id: string) {
    return await this.prismaService.plans.delete({ where: { id } });
  }

  async findAll(courseId: string) {
    const plans = await this.prismaService.plans.findMany({
      where: { courseId: { equals: courseId } },
    });

    plans?.map((plan) => {
      const expiredDate = new Date(plan?.discountExpiredAt);
      if (!plan?.discount || expiredDate < new Date()) {
        delete plan.discount;
        delete plan.discountExpiredAt;
      }

      return plan;
    });

    return plans;
  }

  transformData(data: any) {
    const transformedData = { ...data };

    // Iterate over the keys of the input data
    for (const key in data) {
      // Check if the value is a string and matches "true" or "false"
      if (
        typeof data[key] === 'string' &&
        (data[key] === 'true' || data[key] === 'false')
      ) {
        // Convert the string to a boolean
        transformedData[key] = data[key] === 'true';
      }
    }

    return transformedData;
  }
}
