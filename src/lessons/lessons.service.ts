import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ObjectId } from 'mongodb';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class LessonsService {
  constructor(private prismaService: PrismaService) {}

  async create(moduleId: string, createLessonDto: Prisma.LessonsCreateInput) {
    if (!ObjectId.isValid(moduleId)) {
      throw new BadRequestException('Invalid module id');
    }

    const module = await this.prismaService.modules.findUnique({
      where: { id: moduleId },
    });

    if (!module) {
      throw new BadRequestException('Module not found');
    }

    return this.prismaService.lessons.create({
      data: {
        ...createLessonDto,
        module: {
          connect: {
            id: moduleId,
          },
        },
      },
    });
  }

  async findOne(id: string, user: { userId: string; role: string }) {
    if (!ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid module id');
    }

    const lesson = await this.prismaService.lessons.findUnique({
      where: { id },
      include: {
        module: {
          include: {
            course: {},
          },
        },
      },
    });

    if (!lesson) {
      throw new BadRequestException('Lesson not found');
    }

    // ! if admin, return lesson
    if (user.role === 'admin') {
      delete lesson.module;
      return lesson;
    }

    const course = lesson?.module?.course;

    const myCourse = await this.prismaService.myCourses.findFirst({
      where: {
        userId: user.userId,
        courseId: course.id,
      },
    });

    const hasCourseAccess = myCourse !== undefined;

    const hasExpiredAccess =
      hasCourseAccess && myCourse?.expirationDate < new Date();

    if (!hasCourseAccess || hasExpiredAccess) {
      throw new ForbiddenException('You do not have access to this lesson');
    }

    const plan = await this.prismaService.plans.findUnique({
      where: {
        id: myCourse?.planId,
      },
    });

    if (!plan) {
      throw new BadRequestException('Plan not found');
    }

    const hasAttachedFilesEnabled = plan.includeResources;

    if (!hasAttachedFilesEnabled) {
      delete lesson.attachedFiles;
    }

    delete lesson.module;

    return lesson;
  }

  async update(id: string, updateLessonDto: Prisma.LessonsUpdateInput) {
    if (!ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid lesson id');
    }

    const lesson = await this.prismaService.lessons.findUnique({
      where: { id },
    });

    if (!lesson) {
      throw new BadRequestException('Lesson not found');
    }

    return this.prismaService.lessons.update({
      where: { id },
      data: updateLessonDto,
    });
  }

  async remove(id: string) {
    if (!ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid lesson id');
    }

    const lesson = await this.prismaService.lessons.findUnique({
      where: { id },
    });

    if (!lesson) {
      throw new BadRequestException('Lesson not found');
    }

    return this.prismaService.lessons.delete({ where: { id } });
  }
}
