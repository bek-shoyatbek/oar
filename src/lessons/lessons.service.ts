import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ObjectId } from 'mongodb';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class LessonsService {
  constructor(private prismaService: PrismaService) {}

  async create(moduleId: string, createLessonDto: Prisma.LessonCreateInput) {
    if (!ObjectId.isValid(moduleId)) {
      throw new BadRequestException('Invalid module id');
    }

    const module = await this.prismaService.module.findUnique({
      where: { id: moduleId },
    });

    if (!module) {
      throw new BadRequestException('Module not found');
    }

    return await this.prismaService.lesson.create({
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

  async findOne(id: string) {
    if (!ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid module id');
    }
    return await this.prismaService.lesson.findUnique({ where: { id } });
  }
  async update(id: string, updateLessonDto: Prisma.LessonUpdateInput) {
    if (!ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid lesson id');
    }

    const lesson = await this.prismaService.lesson.findUnique({
      where: { id },
    });

    if (!lesson) {
      throw new BadRequestException('Lesson not found');
    }

    return await this.prismaService.lesson.update({
      where: { id },
      data: updateLessonDto,
    });
  }
  async remove(id: string) {
    if (!ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid lesson id');
    }

    const lesson = await this.prismaService.lesson.findUnique({
      where: { id },
    });

    if (!lesson) {
      throw new BadRequestException('Lesson not found');
    }

    return await this.prismaService.lesson.delete({ where: { id } });
  }
}
