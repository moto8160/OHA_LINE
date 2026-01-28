import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TodoController } from './todo/todo.controller';
import { TodoService } from './todo/todo.service';
import { PrismaService } from './prisma.service';
import { NotificationModule } from './notification/notification.module';
import { AuthModule } from './auth/auth.module';
import { WebhookModule } from './webhook/webhook.module';
import { LinkModule } from './link/link.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    NotificationModule,
    AuthModule,
    WebhookModule,
    LinkModule,
  ],
  controllers: [TodoController],
  providers: [TodoService, PrismaService],
})
export class AppModule {}
