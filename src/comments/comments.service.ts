import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class CommentsService {
  constructor(private readonly prismaService: PrismaService) {}
  async create(createCommentDto: Prisma.CommentsCreateInput) {
    return await this.prismaService.comments.create({
      data: createCommentDto,
    });
  }

  async findAll(isPublished: boolean) {
    return await this.prismaService.comments.findMany({
      where: { isPublished: { equals: isPublished } },
    });
  }

  async findOne(id: string) {
    return await this.prismaService.comments.findUnique({ where: { id } });
  }

  async update(id: string, updateCommentDto: Prisma.CommentsUpdateInput) {
    if (updateCommentDto.isPublished) {
      updateCommentDto.isPublished = Boolean(updateCommentDto.isPublished);
    }
    return await this.prismaService.comments.update({
      where: { id },
      data: updateCommentDto,
    });
  }

  async remove(id: string) {
    return await this.prismaService.comments.delete({ where: { id } });
  }
}
