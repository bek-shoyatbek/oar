import { Module } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { ArticlesController } from './articles.controller';
import { PrismaService } from 'src/prisma.service';
import { S3Service } from 'src/aws/s3/s3.service';

@Module({
  controllers: [ArticlesController],
  providers: [ArticlesService, PrismaService, S3Service],
})
export class ArticlesModule {}
