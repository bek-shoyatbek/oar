import { Test, TestingModule } from '@nestjs/testing';
import { PaymeService } from './payme.service';

describe('PaymeService', () => {
  let service: PaymeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymeService],
    }).compile();

    service = module.get<PaymeService>(PaymeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
