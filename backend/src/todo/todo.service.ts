import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateTodoDto } from './dto/create-todo.dto';

@Injectable()
export class TodoService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, createTodoDto: CreateTodoDto) {
    const { title, date } = createTodoDto;

    const todo = await this.prisma.todo.create({
      data: {
        userId,
        title,
        date: new Date(date),
      },
    });

    return todo;
  }

  async findAll(userId: number) {
    const todos = await this.prisma.todo.findMany({
      where: {
        userId,
      },
      orderBy: {
        date: 'desc',
      },
    });

    return todos;
  }

  async findByDate(userId: number, date: string) {
    const todos = await this.prisma.todo.findMany({
      where: {
        userId,
        date: {
          equals: new Date(date),
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return todos;
  }

  async delete(userId: number, todoId: number) {
    // ユーザーが所有するTodoかどうかを確認
    const todo = await this.prisma.todo.findUnique({
      where: { id: todoId },
    });

    if (!todo) {
      throw new Error('Todo not found');
    }

    if (todo.userId !== userId) {
      throw new Error('Unauthorized to delete this todo');
    }

    // Todoを削除
    return this.prisma.todo.delete({
      where: { id: todoId },
    });
  }

  async updateStatus(userId: number, todoId: number, isCompleted: boolean) {
    const todo = await this.prisma.todo.findUnique({
      where: { id: todoId },
    });

    if (!todo) {
      throw new Error('Todo not found');
    }

    if (todo.userId !== userId) {
      throw new Error('Unauthorized to update this todo');
    }

    return this.prisma.todo.update({
      where: { id: todoId },
      data: { isCompleted },
    });
  }
}
