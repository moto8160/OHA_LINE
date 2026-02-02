import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { NotificationService } from './notification.service';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class NotificationScheduler {
  private readonly logger = new Logger(NotificationScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * 15分おきに実行されるcronジョブ
   * 日本時間で現在時刻と一致するユーザーに通知を送信
   */
  @Cron('0 */30 * * * *', {
    timeZone: 'Asia/Tokyo',
  })
  async handleScheduledNotifications() {
    const currentTime = this.getCurrentTimeInJST();
    this.logger.debug(`スケジューラー起動: 現在時刻 ${currentTime}`);

    try {
      // 現在時刻と一致する通知時刻を持つユーザーを検索
      const users = await this.prisma.user.findMany({
        where: {
          notificationTime: currentTime,
          lineMessagingId: { not: null }, // LINE連携済みのみ
        },
      });

      if (users.length === 0) {
        this.logger.debug(`${currentTime} に通知予定のユーザーはいません`);
        return;
      }

      this.logger.log(`${users.length}名のユーザーに通知を送信開始`);

      // 各ユーザーに通知を送信
      for (const user of users) {
        try {
          await this.notificationService.sendTodayTodos(user.id);
          this.logger.log(
            `✅ ユーザー ${user.id} (${user.lineDisplayName}) に送信成功`,
          );
        } catch (error) {
          this.logger.error(
            `❌ ユーザー ${user.id} への送信失敗: ${error.message}`,
            error.stack,
          );
        }
      }

      this.logger.log(`通知送信完了: ${users.length}名`);
    } catch (error) {
      this.logger.error('スケジューラー実行エラー:', error);
    }
  }

  /**
   * 日本時間の現在時刻を HH:mm 形式で取得
   */
  private getCurrentTimeInJST(): string {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('ja-JP', {
      timeZone: 'Asia/Tokyo',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const parts = formatter.formatToParts(now);
    const hour = parts.find((p) => p.type === 'hour')?.value || '00';
    const minute = parts.find((p) => p.type === 'minute')?.value || '00';

    return `${hour}:${minute}`;
  }
}
