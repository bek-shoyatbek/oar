import { Test, TestingModule } from '@nestjs/testing';
import { UzumService } from './uzum.service';

describe('UzumService', () => {
  let service: UzumService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UzumService],
    }).compile();

    service = module.get<UzumService>(UzumService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
