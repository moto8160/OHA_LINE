import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TodoController } from './todo/todo.controller';
import { TodoService } from './todo/todo.service';
import { UserService } from './user/user.service';
import { PrismaService } from './prisma.service';
import { NotificationModule } from './notification/notification.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    NotificationModule,
    AuthModule,
  ],
  controllers: [TodoController],
  providers: [TodoService, UserService, PrismaService],
})
export class AppModule {}
