import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { ObjectId } from 'mongodb';

@Injectable()
export class ModulesService {
  constructor(private prismaService: PrismaService) {}

  async create(courseId: string, createModuleDto: Prisma.ModuleCreateInput) {
    if (!ObjectId.isValid(courseId)) {
      throw new BadRequestException('Invalid course id');
    }

    const course = await this.prismaService.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new BadRequestException('Course not found');
    }

    return await this.prismaService.module.create({
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
    return await this.prismaService.module.findMany();
  }
  async findOne(id: string) {
    if (!ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid module id');
    }
    return await this.prismaService.module.findUnique({
      where: { id },
      include: {
        Lesson: true,
      },
    });
  }
  async update(id: string, updateModuleDto: Prisma.ModuleUpdateInput) {
    if (!ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid module id');
    }

    const module = await this.prismaService.module.findUnique({
      where: { id },
    });

    if (!module) {
      throw new BadRequestException('Module not found');
    }

    return await this.prismaService.module.update({
      where: { id },
      data: updateModuleDto,
    });
  }
  async remove(id: string) {
    if (!ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid module id');
    }

    const module = await this.prismaService.module.findUnique({
      where: { id },
    });

    if (!module) {
      throw new BadRequestException('Module not found');
    }

    return await this.prismaService.module.delete({ where: { id } });
  }
}
