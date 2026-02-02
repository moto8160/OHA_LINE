import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationScheduler } from './notification.scheduler';
import { LineModule } from '../line/line.module';
import { TodoModule } from '../todo/todo.module';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [LineModule, TodoModule],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationScheduler, PrismaService],
})
export class NotificationModule {}
