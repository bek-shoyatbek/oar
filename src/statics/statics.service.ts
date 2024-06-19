import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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
    return await this.prismaService.statics.findUnique({ where: { id } });
  }

  async getByIdx(idx: string) {
    return await this.prismaService.statics.findMany({ where: { idx } });
  }

  async update(id: string, updateDto: Prisma.StaticsUpdateInput) {
    return await this.prismaService.statics.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: string) {
    return await this.prismaService.statics.delete({ where: { id } });
  }
}
