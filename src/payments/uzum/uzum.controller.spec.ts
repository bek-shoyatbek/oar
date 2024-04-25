import { Test, TestingModule } from '@nestjs/testing';
import { UzumController } from './uzum.controller';
import { UzumService } from './uzum.service';

describe('UzumController', () => {
  let controller: UzumController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UzumController],
      providers: [UzumService],
    }).compile();

    controller = module.get<UzumController>(UzumController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
