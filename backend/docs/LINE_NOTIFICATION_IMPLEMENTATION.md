# LINE通知機能実装ガイド

## 概要

このドキュメントでは、おはLINEアプリケーションにLINE通知機能を実装する手順を説明します。
当アプリケーションでは、自動スケジューラーと手動トリガーの両方の方式で通知を送信できます。

**更新情報**:

- ✅ 自動スケジューラーで毎日指定時刻に本日のTodoを送信
- ✅ 手動ボタンで翌日のTodoを即座に送信
- ✅ 天気情報、トリビア、祝日、励ましメッセージを含む
- ✅ 統一メソッド `sendTodos(userId, 'today'|'tomorrow')` で管理

## 実装手順

### ステップ1: LINE Messaging APIの設定

#### 1.1 LINE Developersアカウントの作成

1. [LINE Developers](https://developers.line.biz/ja/) にアクセス
2. LINEアカウントでログイン
3. プロバイダーを作成（初回のみ）

#### 1.2 チャネルの作成

1. プロバイダー選択後、「チャネルを作成」をクリック
2. 「Messaging API」を選択
3. チャネル情報を入力：
   - チャネル名: `おはLINE`（任意）
   - チャネル説明: 適宜入力
   - カテゴリ: アプリ
   - サブカテゴリ: その他
4. 利用規約に同意して作成

#### 1.3 チャネルアクセストークンの取得

1. 作成したチャネルの「Messaging API」タブを開く
2. 「チャネルアクセストークン（長期）」セクションで「発行」をクリック
3. 表示されたトークンをコピー（後で使用します）

**重要**: このトークンは一度しか表示されないため、必ず保存してください。

#### 1.4 Webhook URLの設定

**現在の実装**: LINE連携（トークン送信）にWebhookが必要です。

- Webhook URL: `https://your-domain.com/line/webhook`
- Webhookの利用: 有効化

#### 1.5 友だち追加用QRコードの取得

1. 「Messaging API」タブの「QRコード」セクション
2. QRコードを表示・保存
3. このQRコードをスキャンして、LINE Botを友だち追加

### ステップ2: 必要なパッケージのインストール

バックエンドディレクトリで以下を実行：

```bash
cd backend
npm install @line/bot-sdk
npm install --save-dev @types/node
```

- `@line/bot-sdk`: LINE Messaging APIの公式SDK

### ステップ3: 環境変数の設定

`backend/.env` ファイルに以下を追加：

```env
# LINE Messaging API
LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token_here

# データベース接続
DATABASE_URL="postgresql://postgres:password@localhost:5432/db"
```

**注意**: `.env` ファイルは `.gitignore` に含まれていることを確認してください。

### ステップ4: LINE通知サービスの作成

#### 4.1 ファイル構成

```
backend/src/
├── line/
│   ├── line.service.ts      # LINE API呼び出しサービス
│   ├── line.module.ts       # LINEモジュール
│   └── line.controller.ts   # 検証エンドポイント
├── notification/
│   ├── notification.service.ts      # 通知ロジック（統一メソッド）
│   ├── notification.controller.ts   # 手動送信エンドポイント
│   ├── notification.scheduler.ts    # 自動スケジューラー
│   └── notification.module.ts       # モジュール定義
│   ├── weather.constant.ts    # 天気情報（5都市）
│   ├── trivia.constant.ts     # トリビア（36個）
│   ├── holidays.constant.ts   # 祝日（97日付）
│   └── motivation.constant.ts # 励ましメッセージ（30個）
└── prisma.service.ts
```

#### 4.2 LINEサービスの実装

**`backend/src/line/line.service.ts`**:

```typescript
import { Injectable } from '@nestjs/common';
import * as line from '@line/bot-sdk';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class LineService {
  private readonly lineClient: line.Client;

  constructor(private readonly prisma: PrismaService) {
    this.lineClient = new line.Client({
      channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
    });
  }

  /**
   * LINEメッセージを送信
   * @param userId LINE User ID
   * @param message 送信するメッセージ
   */
  async sendMessage(lineMessagingId: string, message: string) {
    await this.lineClient.pushMessage(lineMessagingId, {
      type: 'text',
      text: message,
    });
  }

  async handleEvent(event: any) {
    // follow / messageイベントを処理
  }
}
```

#### 4.3 通知サービスの実装（統一メソッド）

**`backend/src/notification/notification.service.ts`** (主要部分):

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { LineService } from '../line/line.service';
import { TodoService } from '../todo/todo.service';
import { TRIVIA_DATA } from './trivia.constant';
import { HOLIDAYS } from './holidays.constant';
import { WEATHER_LOCATIONS } from './weather.constant';
import { MOTIVATION_QUOTES } from './motivation.constant';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly lineService: LineService,
    private readonly todoService: TodoService,
  ) {}

  /**
   * Todoを送信（統一メソッド）
   * @param userId ユーザーID
   * @param type 'today' または 'tomorrow'
   */
  async sendTodos(
    userId: number,
    type: 'today' | 'tomorrow' = 'today',
  ): Promise<void> {
    // ユーザー情報を取得
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }

    if (!user.lineMessagingId) {
      throw new Error(`User ${userId} does not have LINE credentials`);
    }

    // 日付を計算
    const isTomorrow = type === 'tomorrow';
    const dateString = this.getDateString(isTomorrow);
    const date = new Date();
    if (isTomorrow) {
      date.setDate(date.getDate() + 1);
    }

    // 該当日付のTodoを取得
    const todos = await this.todoService.findByDate(dateString);

    // メッセージを構築
    const message = this.buildMessage(todos, date);

    // LINEに送信
    await this.lineService.sendMessage(user.lineMessagingId, message);
  }

  /**
   * メッセージを構築（天気・トリビア・祝日・励ましメッセージ含）
   */
  private async buildMessage(todos: any[], date: Date): Promise<string> {
    const dateStr = date.toLocaleDateString('ja-JP', {
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

    const holiday = this.getTodayHoliday(date);
    if (holiday) {
      message += `\n\n🎊 今日は何の日？\n${holiday}`;
    }

    const weatherSummary = await this.getWeatherSummary();
    if (weatherSummary) {
      message += `\n\n🌤 今日の天気\n${weatherSummary}`;
    }

    const trivia = this.getRandomTrivia();
    message += `\n\n📚 今日の雑学\n${trivia}`;

    const motivation = this.getRandomMotivation();
    message += `\n\n💬 今日のひとこと\n${motivation}`;

    message += '\n\nhttps://oha-line.vercel.app/';

    return message;
  }

  /**
   * 日付文字列を取得（YYYY-MM-DD形式）
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
   * モチベーションクォートをランダムに取得
   */
  private getRandomMotivation(): string {
    return MOTIVATION_QUOTES[
      Math.floor(Math.random() * MOTIVATION_QUOTES.length)
    ];
  }
}
```

#### 4.4 通知コントローラーの実装

**`backend/src/notification/notification.controller.ts`**:

```typescript
import { Controller, Post, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationService } from './notification.service';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * 認証済みユーザーの翌日のTodoをLINE通知
   * POST /notifications/send
   */
  @Post('send')
  @UseGuards(JwtAuthGuard)
  async sendNotification(@Request() req: any) {
    try {
      const userId = req.user.id;
      await this.notificationService.sendTodos(userId, 'tomorrow');
      return {
        success: true,
        message: '翌日のTodo通知を送信しました',
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
```

### ステップ5: 自動スケジューラーの設定

詳細は [SCHEDULER_IMPLEMENTATION.md](./SCHEDULER_IMPLEMENTATION.md) を参照してください。

### ステップ6: モジュールの登録

**`backend/src/notification/notification.module.ts`**:

```typescript
import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationScheduler } from './notification.scheduler';
import { LineModule } from '../line/line.module';
import { TodoModule } from '../todo/todo.module';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [LineModule, TodoModule],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationScheduler, PrismaService],
})
export class NotificationModule {}
```

**`backend/src/line/line.module.ts`**:

```typescript
import { Module } from '@nestjs/common';
import { LineService } from './line.service';

@Module({
  providers: [LineService],
  exports: [LineService],
})
export class LineModule {}
```

### ステップ7: AppModuleへの登録

**`backend/src/app.module.ts`** (抜粋):

```typescript
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationModule } from './notification/notification.module';
import { TodoModule } from './todo/todo.module';
import { AuthModule } from './auth/auth.module';
import { LineModule } from './line/line.module';
import { PrismaService } from './prisma.service';

@Module({
  imports: [
    ScheduleModule.forRoot(), // スケジューラー有効化
    NotificationModule,
    TodoModule,
    AuthModule,
    LineModule,
  ],
  providers: [PrismaService],
})
export class AppModule {}
```

### ステップ8: 定数ファイルの作成

#### 天気情報

**`backend/src/notification/weather.constant.ts`**:

```typescript
export type WeatherLocation = {
  name: string;
  lat: number;
  lon: number;
};

export const WEATHER_LOCATIONS: WeatherLocation[] = [
  { name: '東京', lat: 35.6762, lon: 139.6503 },
  { name: '京都', lat: 35.0116, lon: 135.7681 },
  { name: '大阪', lat: 34.6937, lon: 135.5023 },
  { name: '札幌', lat: 43.0618, lon: 141.3545 },
  { name: '福岡', lat: 33.5902, lon: 130.4017 },
];
```

#### モチベーションクォート

**`backend/src/notification/motivation.constant.ts`**:

```typescript
export const MOTIVATION_QUOTES = [
  '🌟 自分のペースを信じて進もう',
  '💪 今日のあなたなら絶対できる',
  '✨ 小さな積み重ねが大きな成果になる',
  '🚀 チャレンジ精神が成長を生む',
  '💝 自分を褒めることを忘れずに',
  // ... 全30個
];
```

### ステップ9: 動作確認

#### 9.1 バックエンドサーバーの起動

```bash
cd backend
npm run start:dev
```

#### 9.2 スケジューラーの動作確認

ログで確認：

```
[NotificationScheduler] スケジューラー起動: 現在時刻 09:00
[NotificationScheduler] 2名のユーザーに通知を送信開始
```

#### 9.3 手動送信の確認

```bash
curl -X POST http://localhost:5000/notifications/send \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## メッセージ形式

### 統一メッセージ形式

すべての通知は以下の形式で送信されます：

```
📋 今日のTodo (2月7日)

✅ 1. やること1
⬜ 2. やること2

🌤️ 今日の天気
東京: 晴れのち曇り。気温26°C

💡 豆知識
地球は1秒間に約30km移動しています。

✨ 今日のひとこと
🌟 自分のペースを信じて進もう
```

### メッセージ要素

1. **Todoセクション**: 本日のTodo一覧
2. **天気情報**: 5都市からランダム選択
3. **トリビア**: 36個の豆知識からランダム選択
4. **祝日情報**: 該当日付の場合のみ表示
5. **励ましメッセージ**: 30個のクォートからランダム選択

## トラブルシューティング

### エラー: LINE_CHANNEL_ACCESS_TOKEN is not set

```bash
# .envファイルの確認
cat backend/.env | grep LINE_CHANNEL_ACCESS_TOKEN

# サーバー再起動
npm run start:dev
```

### エラー: Invalid channel access token

1. LINE Developersコンソールでトークンを再確認
2. トークンが期限切れでないか確認
3. `.env` ファイルのトークンを更新

### エラー: User not found

```bash
# Prisma Studioで確認
npx prisma studio

# SQL確認
SELECT id, lineDisplayName, lineMessagingId FROM "User";
```

### エラー: スケジューラーが動作しない

1. `ScheduleModule.forRoot()` が `app.module.ts` に追加されているか確認
2. `NotificationScheduler` が `notification.module.ts` の `providers` に登録されているか確認
3. ログを確認: `[NotificationScheduler]` で検索

## 次のステップ

- 🔲 本番環境へのデプロイ
- 🔲 エラーモニタリング設定
- 🔲 メッセージのカスタマイズ拡張
- 🔲 ユーザーごとのメッセージテンプレート設定

## 参考資料

- [LINE Messaging API 公式ドキュメント](https://developers.line.biz/ja/docs/messaging-api/)
- [@line/bot-sdk](https://github.com/line/line-bot-sdk-nodejs)
- [NestJS Scheduler](https://docs.nestjs.com/techniques/task-scheduling)
