import { Controller } from '@nestjs/common';
import { UzumService } from './uzum.service';

@Controller('uzum')
export class UzumController {
  constructor(private readonly uzumService: UzumService) {}
}
