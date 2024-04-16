import { Module } from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { LessonsController } from './lessons.controller';
import { PrismaService } from 'src/prisma.service';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [CloudinaryModule, ConfigModule],
  controllers: [LessonsController],
  providers: [LessonsService, PrismaService],
})
export class LessonsModule {}
