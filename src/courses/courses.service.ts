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
    const courses = await this.prismaService.courses.findMany({
      where: courseStatus ? { courseStatus: courseStatus } : {},
    });

    return courses;
  }

  async findOne(id: string) {
    const course = await this.prismaService.courses.findUnique({
      where: { id },
      include: { Module: true },
    });

    if (!course) {
      throw new BadRequestException('Course not found');
    }

    return course;
  }

  async getMyCourses(userId: string) {
    const myCourses = await this.prismaService.myCourses.findMany({
      where: { userId },
    });

    if (!myCourses) {
      throw new BadRequestException('Course not found');
    }

    for (const myCourse of myCourses) {
      const course = await this.prismaService.courses.findUnique({
        where: { id: myCourse.courseId },
      });

      myCourse['course'] = course;
    }

    return myCourses;
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
    const course = await this.prismaService.courses.findUnique({
      where: { id },
    });

    if (!course) {
      throw new BadRequestException('Course not found');
    }
    return await this.prismaService.courses.delete({ where: { id } });
  }
}
