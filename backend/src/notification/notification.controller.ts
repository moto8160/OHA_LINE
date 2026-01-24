import { Controller, Post, Param, ParseIntPipe } from '@nestjs/common';
import { NotificationService } from './notification.service';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * 指定ユーザーの本日のTodoをLINE通知
   * POST /notifications/send/:userId
   */
  @Post('send/:userId')
  async sendNotification(@Param('userId', ParseIntPipe) userId: number) {
    try {
      await this.notificationService.sendTodayTodos(userId);
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
