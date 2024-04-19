import { Module } from '@nestjs/common';
import { ModulesService } from './modules.service';
import { ModulesController } from './modules.controller';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { PrismaService } from 'src/prisma.service';
import { S3Service } from 'src/aws/s3/s3.service';

@Module({
  imports: [CloudinaryModule],
  controllers: [ModulesController],
  providers: [ModulesService, PrismaService, S3Service],
})
export class ModulesModule {}
