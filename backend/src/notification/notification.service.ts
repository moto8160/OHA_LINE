import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { LineService } from '../line/line.service';
import { TodoService } from '../todo/todo.service';
import { TRIVIA_DATA } from './trivia.constant';
import { HOLIDAYS } from './holidays.constant';
import { WEATHER_LOCATIONS } from './weather.constant';
import { MOTIVATION_QUOTES } from './motivation.constant';

@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly lineService: LineService,
    private readonly todoService: TodoService,
  ) {}

  /**
   * 指定ユーザーのTodoを取得してLINE通知を送信
   * @param userId ユーザーID
   * @param date 'today' or 'tomorrow'
   */
  async sendTodos(userId: number, date: 'today' | 'tomorrow') {
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

    // 本日または明日の日付を取得（日本時間）
    let now = new Date();
    const isTomorrow = date === 'tomorrow';
    const dateString = this.getDateString(isTomorrow);

    // 明日の場合は日付を1日進める
    if (isTomorrow) {
      now.setDate(now.getDate() + 1);
    }

    // 本日/明日のTodoを取得
    const todos = await this.todoService.findByDate(userId, dateString);
    // メッセージを構築
    const message = await this.buildMessage(todos, now);

    // LINEに送信
    await this.lineService.sendMessage(user.lineMessagingId, message);
  }

  /**
   * 日付を日本時間で取得（YYYY-MM-DD形式）
   */
  private getDateString(isTomorrow = false): string {
    const date = new Date();
    if (isTomorrow) {
      date.setDate(date.getDate() + 1);
    }

    const formatter = new Intl.DateTimeFormat('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    const parts = formatter.formatToParts(date);
    const year = parts.find((p) => p.type === 'year')!.value;
    const month = parts.find((p) => p.type === 'month')!.value;
    const day = parts.find((p) => p.type === 'day')!.value;

    return `${year}-${month}-${day}`;
  }

  /**
   * メッセージを構築
   * @param todos Todoリスト
   * @param date 日付
   */
  private async buildMessage(todos: any[], date: Date): Promise<string> {
    const dateStr = date.toLocaleDateString('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });

    let message = `📋 ${dateStr} \n\n`;
    message += `📝 今日のTodo\n`;

    if (todos.length === 0) {
      message += 'Todoはありません🎉';
    } else {
      todos.forEach((todo, index) => {
        message += `${index + 1}. ${todo.title}\n`;
      });
    }

    // 記念日を追加
    const holiday = this.getTodayHoliday(date);
    if (holiday) {
      message += `\n\n🎊 今日は何の日？\n${holiday}`;
    }

    // 天気を追加（有名な場所）
    const weatherSummary = await this.getWeatherSummary();
    if (weatherSummary) {
      message += `\n\n🌤 今日の天気\n${weatherSummary}`;
    }

    // 雑学を追加
    const trivia = this.getRandomTrivia();
    message += `\n\n📚 今日の雑学\n${trivia}`;

    // 今日のひとことを追加
    const motivation = this.getRandomMotivation();
    message += `\n\n💬 今日のひとこと\n${motivation}`;

    message += '\n\nhttps://oha-line.vercel.app/';

    return message;
  }

  /**
   * ランダムに雑学を選択
   */
  private getRandomTrivia(): string {
    const randomIndex = Math.floor(Math.random() * TRIVIA_DATA.length);
    return TRIVIA_DATA[randomIndex];
  }

  /**
   * ランダムに元気が出るひとことを選択
   */
  private getRandomMotivation(): string {
    const randomIndex = Math.floor(Math.random() * MOTIVATION_QUOTES.length);
    return MOTIVATION_QUOTES[randomIndex];
  }

  /**
   * 本日の記念日を取得
   */
  private getTodayHoliday(date: Date): string | null {
    // 日本時間で現在の日付をMMDD形式で取得
    const formatter = new Intl.DateTimeFormat('ja-JP', {
      timeZone: 'Asia/Tokyo',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatter.formatToParts(date);
    const month = parts.find((p) => p.type === 'month')?.value;
    const day = parts.find((p) => p.type === 'day')?.value;
    const mmdd = `${month}${day}`;

    return HOLIDAYS[mmdd] || null;
  }

  /**
   * Open-Meteoの無料APIから天気を取得
   */
  private async getWeatherSummary(): Promise<string | null> {
    const fetchFn = (globalThis as any).fetch as (
      input: string,
    ) => Promise<any>;
    if (!fetchFn) {
      return null;
    }

    const results = await Promise.all(
      WEATHER_LOCATIONS.map(async (loc) => {
        const url =
          `https://api.open-meteo.com/v1/forecast?` +
          `latitude=${loc.lat}&longitude=${loc.lon}` +
          `&current=temperature_2m,weather_code&timezone=Asia%2FTokyo`;
        try {
          const res = await fetchFn(url);
          if (!res?.ok) return null;
          const data = await res.json();
          const current = data?.current;
          if (!current) return null;
          const temp = Math.round(current.temperature_2m);
          const desc = this.mapWeatherCode(current.weather_code);
          return `${loc.name}: ${desc} ${temp}℃`;
        } catch {
          return null;
        }
      }),
    );

    const lines = results.filter((line) => Boolean(line)) as string[];
    if (lines.length === 0) return null;
    return lines.join('\n');
  }

  /**
   * 天気コードを簡易的に説明へ変換
   */
  private mapWeatherCode(code: number): string {
    if (code === 0) return '☀️ 快晴';
    if (code === 1 || code === 2) return '🌤 晴れ時々雲';
    if (code === 3) return '☁️ くもり';
    if (code === 45 || code === 48) return '🌫 霧';
    if (code >= 51 && code <= 57) return '🌦 霧雨';
    if (code >= 61 && code <= 67) return '🌧 雨';
    if (code >= 71 && code <= 77) return '🌨 雪';
    if (code >= 80 && code <= 82) return '🌦 にわか雨';
    if (code >= 85 && code <= 86) return '🌨 にわか雪';
    if (code >= 95) return '⛈ 雷雨';
    return '❓ 天気不明';
  }
}
