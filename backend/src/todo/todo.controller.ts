import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { TodoService } from './todo.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('todos')
@UseGuards(JwtAuthGuard)
export class TodoController {
  constructor(private readonly todoService: TodoService) {}

  @Post()
  async create(@CurrentUser() user: any, @Body() createTodoDto: CreateTodoDto) {
    return this.todoService.create(user.id, createTodoDto);
  }

  @Get()
  async findAll(@CurrentUser() user: any) {
    return this.todoService.findAll(user.id);
  }

  @Get('by-date')
  async findByDate(@CurrentUser() user: any, @Query('date') date: string) {
    if (!date) {
      return { error: 'date query parameter is required' };
    }
    return this.todoService.findByDate(user.id, date);
  }
}
