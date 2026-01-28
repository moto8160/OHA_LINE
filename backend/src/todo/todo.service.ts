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
}
