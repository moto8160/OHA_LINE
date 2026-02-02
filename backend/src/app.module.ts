import { Module } from '@nestjs/common';
import { TodoModule } from './todo/todo.module';
import { AuthModule } from './auth/auth.module';
import { NotificationModule } from './notification/notification.module';
import { LineModule } from './line/line.module';
import { PrismaService } from './prisma.service';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    TodoModule,
    AuthModule,
    NotificationModule,
    LineModule,
    ScheduleModule.forRoot(),
  ],
  providers: [PrismaService],
})
export class AppModule {}
