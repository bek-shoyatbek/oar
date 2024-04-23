import { Module } from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { LessonsController } from './lessons.controller';
import { PrismaService } from 'src/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { S3Service } from 'src/aws/s3/s3.service';

@Module({
  imports: [ConfigModule],
  controllers: [LessonsController],
  providers: [LessonsService, PrismaService, S3Service],
})
export class LessonsModule {}
