import { Module } from '@nestjs/common';
import { StaticsService } from './statics.service';
import { StaticsController } from './statics.controller';
import { S3Service } from 'src/aws/s3/s3.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from 'src/prisma.service';

@Module({
  imports: [ConfigModule],
  controllers: [StaticsController],
  providers: [S3Service, StaticsService, PrismaService],
})
export class StaticsModule {}
