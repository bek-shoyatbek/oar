import { Injectable, ParseBoolPipe } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class BannersService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createBannerDto: Prisma.BannersCreateInput) {
    return this.prismaService.banners.create({
      data: createBannerDto,
    });
  }

  async findAll(isPublished: boolean) {
    return await this.prismaService.banners.findMany({
      where: { isPublished },
    });
  }

  async findOne(id: string) {
    return await this.prismaService.banners.findUnique({
      where: { id },
    });
  }

  async update(id: string, updateBannerDto: Prisma.BannersUpdateInput) {
    const published = updateBannerDto.isPublished as string;
    if (published) {
      updateBannerDto.isPublished = published === 'true' ? true : false;
    }
    return await this.prismaService.banners.update({
      where: { id },
      data: updateBannerDto,
    });
  }

  async remove(id: string) {
    return await this.prismaService.banners.delete({
      where: { id },
    });
  }
}
