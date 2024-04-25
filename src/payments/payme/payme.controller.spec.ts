import { Test, TestingModule } from '@nestjs/testing';
import { PaymeController } from './payme.controller';
import { PaymeService } from './payme.service';

describe('PaymeController', () => {
  let controller: PaymeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymeController],
      providers: [PaymeService],
    }).compile();

    controller = module.get<PaymeController>(PaymeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
