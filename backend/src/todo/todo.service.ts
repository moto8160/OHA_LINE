import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateTodoDto } from './dto/create-todo.dto';

const FIXED_USER_ID = 5;

@Injectable()
export class TodoService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTodoDto: CreateTodoDto) {
    const { title, date } = createTodoDto;

    const todo = await this.prisma.todo.create({
      data: {
        userId: FIXED_USER_ID,
        title,
        date: new Date(date),
      },
    });

    return todo;
  }

  async findAll() {
    const todos = await this.prisma.todo.findMany({
      where: {
        userId: FIXED_USER_ID,
      },
      orderBy: {
        date: 'desc',
      },
    });

    return todos;
  }

  async findByDate(date: string) {
    const todos = await this.prisma.todo.findMany({
      where: {
        userId: FIXED_USER_ID,
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
