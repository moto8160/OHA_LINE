import { Controller, Post, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * ログインユーザーの本日のTodoをLINE通知
   * POST /notifications/send
   */
  @Post('send')
  async sendNotification(@CurrentUser() user: any) {
    try {
      await this.notificationService.sendTodayTodos(user.id);
      return {
        success: true,
        message: 'LINE通知を送信しました',
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'エラーが発生しました',
      };
    }
  }
}
