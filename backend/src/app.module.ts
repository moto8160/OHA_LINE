import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TodoModule } from './todo/todo.module';
import { AuthModule } from './auth/auth.module';
import { NotificationModule } from './notification/notification.module';
import { LineModule } from './line/line.module';
import { PrismaService } from './prisma.service';

@Module({
  imports: [TodoModule, AuthModule, NotificationModule, LineModule],
  providers: [PrismaService],
})
export class AppModule {}
