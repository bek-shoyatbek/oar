import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { PrismaService } from 'src/prisma.service';
import { S3Service } from 'src/aws/s3/s3.service';

@Module({
  controllers: [CommentsController],
  providers: [CommentsService, PrismaService, S3Service],
})
export class CommentsModule {}
