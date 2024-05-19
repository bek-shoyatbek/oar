import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class CoursesService {
  constructor(private prismaService: PrismaService) {}

  async create(createCourseDto: Prisma.CoursesCreateInput) {
    return await this.prismaService.courses.create({ data: createCourseDto });
  }

  async findAll(courseStatus?: 'completed' | 'inProgress' | 'archived') {
    return await this.prismaService.courses.findMany({
      where: courseStatus ? { courseStatus: courseStatus } : {},
    });
  }

  async findOne(id: string) {
    return await this.prismaService.courses.findUnique({
      where: { id },
      include: { Module: true },
    });
  }

  async getMyCourses(userId: string) {
    return await this.prismaService.myCourses.findMany({
      where: { userId },
    });
  }

  async update(id: string, updateCourseDto: Prisma.CoursesUpdateInput) {
    const course = await this.prismaService.courses.findUnique({
      where: { id },
    });

    if (!course) {
      throw new BadRequestException('Course not found');
    }

    return await this.prismaService.courses.update({
      where: { id },
      data: updateCourseDto,
    });
  }

  async remove(id: string) {
    console.log("id",id);
    const course = await this.prismaService.courses.findUnique({
      where: { id },
    });

    if (!course) {
      throw new BadRequestException('Course not found');
    }
    return await this.prismaService.courses.delete({ where: { id } });
  }
}
