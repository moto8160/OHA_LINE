# LINE通知機能実装ガイド

## 概要

このドキュメントでは、LineNoticeアプリケーションにLINE通知機能を実装する手順を説明します。
最初の実装では、時間指定による自動送信は行わず、ユーザーが手動でトリガーする方式とします。

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
   - チャネル名: `LineNotice`（任意）
   - チャネル説明: 適宜入力
   - カテゴリ: アプリ
   - サブカテゴリ: その他
4. 利用規約に同意して作成

#### 1.3 チャネルアクセストークンの取得

1. 作成したチャネルの「Messaging API」タブを開く
2. 「チャネルアクセストークン（長期）」セクションで「発行」をクリック
3. 表示されたトークンをコピー（後で使用します）

**重要**: このトークンは一度しか表示されないため、必ず保存してください。

#### 1.4 Webhook URLの設定（オプション）

今回は手動実行のみなので、Webhookは設定不要です。
将来的に自動応答機能を追加する場合は、以下を設定：
- Webhook URL: `https://your-domain.com/webhook`
- Webhookの利用: 有効化

#### 1.5 友だち追加用QRコードの取得

1. 「Messaging API」タブの「QRコード」セクション
2. QRコードを表示・保存
3. このQRコードをスキャンして、LINE Botを友だち追加

### ステップ2: 必要なパッケージのインストール

バックエンドディレクトリで以下を実行：

```bash
cd backend
npm install @line/bot-sdk axios
npm install --save-dev @types/node
```

- `@line/bot-sdk`: LINE Messaging APIの公式SDK
- `axios`: HTTPリクエスト用（LINE API呼び出しに使用）

### ステップ3: 環境変数の設定

`backend/.env` ファイルに以下を追加：

```env
# LINE Messaging API
LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token_here
```

**注意**: `.env` ファイルは `.gitignore` に含まれていることを確認してください。

### ステップ4: LINE通知サービスの作成

#### 4.1 ファイル構成

以下のファイルを作成します：

```
backend/src/
├── line/
│   ├── line.service.ts      # LINE API呼び出しサービス
│   └── line.module.ts        # LINEモジュール（オプション）
└── notification/
    ├── notification.service.ts  # 通知ロジック
    └── notification.controller.ts  # 手動実行用エンドポイント
```

#### 4.2 LINEサービスの実装

**`backend/src/line/line.service.ts`** を作成：

```typescript
import { Injectable } from '@nestjs/common';
import * as line from '@line/bot-sdk';
import axios from 'axios';

@Injectable()
export class LineService {
  private readonly channelAccessToken: string;
  private readonly lineClient: line.Client;

  constructor() {
    this.channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN || '';
    
    if (!this.channelAccessToken) {
      throw new Error('LINE_CHANNEL_ACCESS_TOKEN is not set');
    }

    this.lineClient = new line.Client({
      channelAccessToken: this.channelAccessToken,
    });
  }

  /**
   * LINEメッセージを送信
   * @param userId LINE User ID
   * @param message 送信するメッセージ
   */
  async sendMessage(userId: string, message: string): Promise<void> {
    try {
      await this.lineClient.pushMessage(userId, {
        type: 'text',
        text: message,
      });
    } catch (error) {
      console.error('LINE送信エラー:', error);
      throw error;
    }
  }

  /**
   * 複数メッセージを送信
   * @param userId LINE User ID
   * @param messages 送信するメッセージ配列
   */
  async sendMessages(userId: string, messages: string[]): Promise<void> {
    try {
      const messageObjects = messages.map((text) => ({
        type: 'text' as const,
        text: text,
      }));

      await this.lineClient.pushMessage(userId, messageObjects);
    } catch (error) {
      console.error('LINE送信エラー:', error);
      throw error;
    }
  }
}
```

#### 4.3 通知サービスの実装

**`backend/src/notification/notification.service.ts`** を作成：

```typescript
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

    if (!user.lineUserId || !user.lineToken) {
      throw new Error(`User ${userId} does not have LINE credentials`);
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
```

#### 4.4 通知コントローラーの実装

**`backend/src/notification/notification.controller.ts`** を作成：

```typescript
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
}
```

### ステップ5: モジュールの登録

#### 5.1 LINEモジュールの作成（オプション）

**`backend/src/line/line.module.ts`** を作成：

```typescript
import { Module } from '@nestjs/common';
import { LineService } from './line.service';

@Module({
  providers: [LineService],
  exports: [LineService],
})
export class LineModule {}
```

#### 5.2 通知モジュールの作成

**`backend/src/notification/notification.module.ts`** を作成：

```typescript
import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { LineService } from '../line/line.service';
import { PrismaService } from '../prisma.service';
import { TodoService } from '../todo/todo.service';

@Module({
  controllers: [NotificationController],
  providers: [NotificationService, LineService, PrismaService, TodoService],
})
export class NotificationModule {}
```

#### 5.3 AppModuleへの登録

**`backend/src/app.module.ts`** を更新：

```typescript
import { Module } from '@nestjs/common';
import { TodoController } from './todo/todo.controller';
import { TodoService } from './todo/todo.service';
import { UserService } from './user/user.service';
import { PrismaService } from './prisma.service';
import { NotificationModule } from './notification/notification.module'; // 追加

@Module({
  imports: [NotificationModule], // 追加
  controllers: [TodoController],
  providers: [TodoService, UserService, PrismaService],
})
export class AppModule {}
```

### ステップ6: データベースの更新

現在のUserテーブルには`lineUserId`と`lineToken`フィールドが既に存在しますが、
実際のLINE User IDを取得する必要があります。

#### 6.1 LINE User IDの取得方法

1. LINE Botを友だち追加
2. Botに何かメッセージを送信（Webhookが設定されていれば取得可能）
3. または、LINE Developersコンソールの「Messaging API」タブで確認

#### 6.2 データベースへの反映

Prisma Studioを使用して更新：

```bash
cd backend
npx prisma studio
```

または、直接SQLで更新：

```sql
UPDATE "User" 
SET "lineUserId" = '実際のLINE_USER_ID', 
    "lineToken" = '実際のCHANNEL_ACCESS_TOKEN'
WHERE id = 1;
```

**注意**: `lineToken`フィールドは実際には使用しませんが、将来的な拡張のために保持しています。
実際の送信には環境変数の`LINE_CHANNEL_ACCESS_TOKEN`を使用します。

### ステップ7: 動作確認

#### 7.1 バックエンドサーバーの起動

```bash
cd backend
npm run start:dev
```

#### 7.2 通知の送信テスト

固定ユーザー（ID: 1）に通知を送信：

```bash
curl -X POST http://localhost:5000/notifications/send
```

または、指定ユーザーに送信：

```bash
curl -X POST http://localhost:5000/notifications/send/1
```

#### 7.3 レスポンス例

成功時：
```json
{
  "success": true,
  "message": "LINE通知を送信しました"
}
```

エラー時：
```json
{
  "success": false,
  "message": "エラーメッセージ"
}
```

## トラブルシューティング

### エラー: LINE_CHANNEL_ACCESS_TOKEN is not set

- `.env`ファイルに`LINE_CHANNEL_ACCESS_TOKEN`が設定されているか確認
- バックエンドサーバーを再起動

### エラー: Invalid channel access token

- LINE Developersコンソールでトークンが正しく発行されているか確認
- トークンが期限切れでないか確認（長期トークンの場合、有効期限は確認が必要）

### エラー: User not found

- データベースにユーザーが存在するか確認
- `npx prisma studio`で確認

### エラー: LINE送信エラー

- LINE Botが友だち追加されているか確認
- LINE User IDが正しいか確認
- チャネルアクセストークンが有効か確認

## 次のステップ

実装が完了したら、以下の機能追加を検討できます：

1. **フロントエンドからの通知送信**
   - フロントエンドに「通知を送信」ボタンを追加
   - APIエンドポイントを呼び出して通知を送信

2. **通知履歴の保存**
   - 送信履歴テーブルを作成
   - 送信日時、内容、成功/失敗を記録

3. **エラーハンドリングの強化**
   - リトライロジックの実装
   - エラーログの記録

4. **メッセージフォーマットの改善**
   - Flex Messageの使用
   - リッチなUIでの表示

5. **天気予報・AI機能の統合**
   - 天気予報APIの連携
   - AI APIの連携

## 参考資料

- [LINE Messaging API 公式ドキュメント](https://developers.line.biz/ja/docs/messaging-api/)
- [@line/bot-sdk 公式リポジトリ](https://github.com/line/line-bot-sdk-nodejs)
- [NestJS 公式ドキュメント](https://docs.nestjs.com/)
