import { Module } from '@nestjs/common';
import { UzumService } from './uzum.service';
import { UzumController } from './uzum.controller';

@Module({
  controllers: [UzumController],
  providers: [UzumService],
})
export class UzumModule {}
