import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Query,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
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

  @Delete(':id')
  async delete(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) todoId: number,
  ) {
    try {
      const deletedTodo = await this.todoService.delete(user.id, todoId);
      return {
        success: true,
        message: 'Todoを削除しました',
        deletedTodo,
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Todoの削除に失敗しました',
      };
    }
  }
}
