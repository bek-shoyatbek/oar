import { Controller, Delete, Patch, Post } from '@nestjs/common';
import { ArticlesService } from './articles.service';

@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}
  @Post('create')
  async create() {}

  @Patch('update/:id')
  async update() {}

  @Delete('remove/:id')
  async remove() {}
}
