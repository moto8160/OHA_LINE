import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { LineService } from '../line/line.service';
import { TodoService } from '../todo/todo.service';

@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly lineService: LineService,
    private readonly todoService: TodoService,
  ) {}

  /**
   * 指定ユーザーの本日のTodoを取得してLINE通知を送信
   * @param userId ユーザーID
   */
  async sendTodayTodos(userId: number): Promise<void> {
    // ユーザー情報を取得
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }

    if (!user.lineMessagingId) {
      throw new Error(
        `User ${userId} does not have LINE Messaging User ID. Please add the LINE bot as a friend.`,
      );
    }

    // 本日の日付を取得（日本時間）
    const now = new Date();
    const todayString = this.getTodayString();

    // 本日のTodoを取得
    const todos = await this.todoService.findByDate(userId, todayString);

    // メッセージを構築
    const message = this.buildMessage(todos, now);

    // LINEに送信
    await this.lineService.sendMorningMessage(user.lineMessagingId, message);
  }

  /**
   * 本日の日付を日本時間で取得（YYYY-MM-DD形式）
   */
  private getTodayString(): string {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatter.formatToParts(now);
    const year = parts.find((p) => p.type === 'year')?.value;
    const month = parts.find((p) => p.type === 'month')?.value;
    const day = parts.find((p) => p.type === 'day')?.value;
    return `${year}-${month}-${day}`;
  }

  /**
   * メッセージを構築
   */
  private buildMessage(todos: any[], date: Date): string {
    const dateStr = date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });

    let message = `📋 ${dateStr} のTodo一覧\n\n`;

    if (todos.length === 0) {
      message +=
        '本日のTodoはありません。\n素晴らしい一日をお過ごしください！✨';
    } else {
      todos.forEach((todo, index) => {
        const status = todo.isCompleted ? '✅' : '⬜';
        message += `${status} ${index + 1}. ${todo.title}\n`;
      });
      message += '\n今日も頑張りましょう！💪';
    }

    return message;
  }
}
