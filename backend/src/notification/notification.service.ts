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

    if (!user.lineUserId) {
      throw new Error(`User ${userId} does not have LINE User ID`);
    }

    // 本日の日付を取得
    const today = new Date();
    const todayString = today.toISOString().split('T')[0]; // YYYY-MM-DD形式

    // 本日のTodoを取得
    const todos = await this.todoService.findByDate(todayString);

    // メッセージを構築
    const message = this.buildMessage(todos, today);

    // LINEに送信
    await this.lineService.sendMessage(user.lineUserId, message);
  }

  /**
   * 固定文字列をLINEに送信（テスト用）
   * @param lineUserId LINE User ID
   * @param message 送信するメッセージ
   */
  async sendTestMessage(lineUserId: string, message: string): Promise<void> {
    await this.lineService.sendMessage(lineUserId, message);
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
      message += '本日のTodoはありません。\n素晴らしい一日をお過ごしください！✨';
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
