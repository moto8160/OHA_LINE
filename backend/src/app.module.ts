import { Module } from '@nestjs/common';
import { TodoController } from './todo/todo.controller';
import { TodoService } from './todo/todo.service';
import { UserService } from './user/user.service';
import { PrismaService } from './prisma.service';

@Module({
  controllers: [TodoController],
  providers: [TodoService, UserService, PrismaService],
})
export class AppModule {}
