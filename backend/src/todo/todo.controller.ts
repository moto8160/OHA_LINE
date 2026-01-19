import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { TodoService } from './todo.service';
import { CreateTodoDto } from './dto/create-todo.dto';

@Controller('todos')
export class TodoController {
  constructor(private readonly todoService: TodoService) {}

  @Post()
  async create(@Body() createTodoDto: CreateTodoDto) {
    return this.todoService.create(createTodoDto);
  }

  @Get()
  async findAll() {
    return this.todoService.findAll();
  }

  @Get('by-date')
  async findByDate(@Query('date') date: string) {
    if (!date) {
      return { error: 'date query parameter is required' };
    }
    return this.todoService.findByDate(date);
  }
}
