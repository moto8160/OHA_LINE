import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Body,
  Query,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { TodoService } from './todo.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoStatusDto } from './dto/update-todo-status.dto';
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

  @Delete('completed')
  async deleteCompleted(@CurrentUser() user: any) {
    try {
      const deletedCount = await this.todoService.deleteCompleted(user.id);
      return {
        success: true,
        message: '完了済みTodoを削除しました',
        deletedCount,
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : '完了済みTodoの削除に失敗しました',
      };
    }
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

  @Patch(':id/status')
  async updateStatus(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) todoId: number,
    @Body() updateTodoStatusDto: UpdateTodoStatusDto,
  ) {
    try {
      const updatedTodo = await this.todoService.updateStatus(
        user.id,
        todoId,
        updateTodoStatusDto.isCompleted,
      );
      return {
        success: true,
        message: 'Todoの状態を更新しました',
        updatedTodo,
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Todoの更新に失敗しました',
      };
    }
  }
}
