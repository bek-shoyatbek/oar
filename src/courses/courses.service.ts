import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class CoursesService {
  constructor(private prismaService: PrismaService) {}

  async create(createCourseDto: Prisma.CourseCreateInput) {
    return await this.prismaService.course.create({ data: createCourseDto });
  }

  async findAll() {
    return await this.prismaService.course.findMany();
  }

  async findOne(id: string) {
    return await this.prismaService.course.findUnique({
      where: { id },
      include: { Module: true },
    });
  }

  async update(id: string, updateCourseDto: Prisma.CourseUpdateInput) {
    const course = await this.prismaService.course.findUnique({
      where: { id },
    });

    if (!course) {
      throw new BadRequestException('Course not found');
    }

    return await this.prismaService.course.update({
      where: { id },
      data: updateCourseDto,
    });
  }

  async remove(id: string) {
    const course = await this.prismaService.course.findUnique({
      where: { id },
    });

    if (!course) {
      throw new BadRequestException('Course not found');
    }
    return await this.prismaService.course.delete({ where: { id } });
  }
}
