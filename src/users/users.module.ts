import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaService } from 'src/prisma.service';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { MulterModule } from '@nestjs/platform-express';
import { S3Service } from 'src/aws/s3/s3.service';

@Module({
  imports: [
    MulterModule.register({
      dest: './uploads',
    }),
    CloudinaryModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, PrismaService, S3Service],
})
export class UsersModule {}
