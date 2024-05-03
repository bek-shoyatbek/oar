import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ObjectId } from 'mongodb';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class ArticlesService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createArticleDto: Prisma.ArticlesCreateInput) {
    return await this.prismaService.articles.create({ data: createArticleDto });
  }

  async update(id: string, updateArticleDto: Prisma.ArticlesUpdateInput) {
    if (!ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid article id');
    }

    const article = await this.prismaService.articles.findUnique({
      where: { id },
    });

    if (!article) {
      throw new BadRequestException('Article not found');
    }

    return await this.prismaService.articles.update({
      where: { id },
      data: updateArticleDto,
    });
  }

  async remove(id: string) {
    if (!ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid article id');
    }

    const article = await this.prismaService.articles.findUnique({
      where: { id },
    });

    if (!article) {
      throw new BadRequestException('Article not found');
    }

    return await this.prismaService.articles.delete({ where: { id } });
  }

  async findAll(isPublished: boolean) {
    return await this.prismaService.articles.findMany({
      where: { isPublished },
    });
  }

  async findOne(id: string) {
    if (!ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid article id');
    }

    return await this.prismaService.articles.findUnique({ where: { id } });
  }
}
