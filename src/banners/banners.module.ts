import { Module } from '@nestjs/common';
import { BannersService } from './banners.service';
import { BannersController } from './banners.controller';
import { PrismaService } from 'src/prisma.service';
import { S3Service } from 'src/aws/s3/s3.service';

@Module({
  controllers: [BannersController],
  providers: [BannersService, PrismaService, S3Service],
})
export class BannersModule {}
