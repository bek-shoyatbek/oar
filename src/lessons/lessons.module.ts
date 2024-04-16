import { Module } from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { LessonsController } from './lessons.controller';
import { PrismaService } from 'src/prisma.service';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { ConfigModule } from '@nestjs/config';
import { DriveModule } from 'src/google/drive/drive.module';
import { DriveService } from 'src/google/drive/drive.service';

@Module({
  imports: [CloudinaryModule, ConfigModule, DriveModule],
  controllers: [LessonsController],
  providers: [LessonsService, PrismaService, DriveService],
})
export class LessonsModule {}
