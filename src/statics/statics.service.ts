import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ObjectId } from 'mongodb';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class StaticsService {
  constructor(private readonly prismaService: PrismaService) {}

  async uploadFile(uploadDto: Prisma.StaticsCreateInput) {
    return await this.prismaService.statics.create({ data: uploadDto });
  }

  async getAll() {
    return await this.prismaService.statics.findMany();
  }

  async getById(id: string) {
    this.isValidObjectId(id);
    const file = await this.prismaService.statics.findUnique({ where: { id } });
    if (!file) {
      throw new BadRequestException('File not found');
    }
    return file;
  }

  async getByIdx(idx: string) {
    const files = await this.prismaService.statics.findMany({ where: { idx } });
    if (!files) {
      throw new BadRequestException('File not found');
    }
    return files;
  }

  async update(id: string, updateDto: Prisma.StaticsUpdateInput) {
    this.isValidObjectId(id);
    return await this.prismaService.statics.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: string) {
    this.isValidObjectId(id);
    return await this.prismaService.statics.delete({ where: { id } });
  }

  isValidObjectId(id: string) {
    if (!ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid id');
    }
  }
}
