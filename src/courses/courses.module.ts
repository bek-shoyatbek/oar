import { Module } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { PrismaService } from 'src/prisma.service';
import { S3Service } from 'src/aws/s3/s3.service';

@Module({
  imports: [],
  controllers: [CoursesController],
  providers: [CoursesService, PrismaService, S3Service],
})
export class CoursesModule {}
