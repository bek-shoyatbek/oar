import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaService } from 'src/prisma.service';
import { MulterModule } from '@nestjs/platform-express';
import { S3Service } from 'src/aws/s3/s3.service';
import { HashingService } from 'src/utils/hashing/hashing.service';

@Module({
  imports: [
    MulterModule.register({
      dest: './uploads',
    }),
  ],
  controllers: [UsersController],
  providers: [UsersService, PrismaService, S3Service, HashingService],
})
export class UsersModule {}
