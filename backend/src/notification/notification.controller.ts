import { Controller, Post, Param, ParseIntPipe, Body } from '@nestjs/common';
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
        message: error instanceof Error ? error.message : 'エラーが発生しました',
      };
    }
  }

  /**
   * 固定ユーザー（ID: 1）の本日のTodoをLINE通知
   * POST /notifications/send
   */
  @Post('send')
  async sendNotificationToFixedUser() {
    const FIXED_USER_ID = 1;
    return this.sendNotification(FIXED_USER_ID);
  }

  /**
   * 固定文字列をLINEに送信（テスト用）
   * POST /notifications/test
   * リクエストボディ: { "lineUserId": "YOUR_LINE_USER_ID", "message": "テストメッセージ" }
   */
  @Post('test')
  async sendTestMessage(@Body() body: { lineUserId: string; message?: string }) {
    try {
      const { lineUserId, message } = body;

      if (!lineUserId) {
        return {
          success: false,
          message: 'lineUserId is required',
        };
      }

      const testMessage = message || 'こんにちは！これはテストメッセージです。';
      await this.notificationService.sendTestMessage(lineUserId, testMessage);

      return {
        success: true,
        message: 'テストメッセージを送信しました',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'エラーが発生しました',
      };
    }
  }
}
