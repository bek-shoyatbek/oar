import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { ObjectId } from 'mongodb';

@Injectable()
export class ModulesService {
  constructor(private prismaService: PrismaService) {}

  async create(courseId: string, createModuleDto: Prisma.ModulesCreateInput) {
    if (!ObjectId.isValid(courseId)) {
      throw new BadRequestException('Invalid course id');
    }

    const course = await this.prismaService.courses.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new BadRequestException('Course not found');
    }

    return await this.prismaService.modules.create({
      data: {
        ...createModuleDto,
        course: {
          connect: {
            id: courseId,
          },
        },
      },
    });
  }
  async findAll() {
    return await this.prismaService.modules.findMany();
  }
  async findOne(id: string) {
    if (!ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid module id');
    }
    const module = await this.prismaService.modules.findUnique({
      where: { id },
      include: {
        Lesson: true,
      },
    });

    if (!module) {
      throw new BadRequestException('Module not found');
    }

    return module;
  }
  async update(id: string, updateModuleDto: Prisma.ModulesUpdateInput) {
    if (!ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid module id');
    }

    const module = await this.prismaService.modules.findUnique({
      where: { id },
    });

    if (!module) {
      throw new BadRequestException('Module not found');
    }

    return await this.prismaService.modules.update({
      where: { id },
      data: updateModuleDto,
    });
  }
  async remove(id: string) {
    if (!ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid module id');
    }

    const module = await this.prismaService.modules.findUnique({
      where: { id },
    });

    if (!module) {
      throw new BadRequestException('Module not found');
    }

    return await this.prismaService.modules.delete({ where: { id } });
  }
}
