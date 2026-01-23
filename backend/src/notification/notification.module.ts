import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { LineService } from '../line/line.service';
import { PrismaService } from '../prisma.service';
import { TodoService } from '../todo/todo.service';

@Module({
  controllers: [NotificationController],
  providers: [NotificationService, LineService, PrismaService, TodoService],
})
export class NotificationModule {}
