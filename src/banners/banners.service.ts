import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { S3Service } from 'src/aws/s3/s3.service';
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
    const banners = await this.prismaService.banners.findMany({
      where: { isPublished },
    });

    return banners;
  }

  async findOne(id: string) {
    const banner = await this.prismaService.banners.findUnique({
      where: { id },
    });
    return banner;
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
