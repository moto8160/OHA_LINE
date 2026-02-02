# LINE通知の自動送信システム 設計・実装ガイド

## 📋 目次

1. [システム概要](#システム概要)
2. [使用技術の解説](#使用技術の解説)
3. [NestJS Schedulerとは](#nestjs-schedulerとは)
4. [システム構成図](#システム構成図)
5. [実装の流れ](#実装の流れ)
6. [コード詳細解説](#コード詳細解説)
7. [動作確認方法](#動作確認方法)
8. [トラブルシューティング](#トラブルシューティング)

---

## システム概要

### 何を実現するのか？

ユーザーが設定した時刻（例: 09:00）に、**毎日自動的にLINEで本日のTodoを通知する**システムです。

### 仕組みの全体像

```
┌─────────────────────────────────────────────┐
│ バックエンドサーバー (NestJS)              │
│                                             │
│  ┌──────────────────────────────┐          │
│  │ ⏰ スケジューラー             │          │
│  │  毎分0秒に自動実行            │          │
│  └────────┬─────────────────────┘          │
│           │                                 │
│           ▼                                 │
│  ┌──────────────────────────────┐          │
│  │ 📊 データベース検索           │          │
│  │  「今の時刻 = 通知時刻」の    │          │
│  │  ユーザーを全て取得           │          │
│  └────────┬─────────────────────┘          │
│           │                                 │
│           ▼                                 │
│  ┌──────────────────────────────┐          │
│  │ 📝 Todo取得                   │          │
│  │  各ユーザーの本日のTodoを取得 │          │
│  └────────┬─────────────────────┘          │
│           │                                 │
│           ▼                                 │
│  ┌──────────────────────────────┐          │
│  │ 📤 LINE送信                   │          │
│  │  LINEメッセージAPI経由で送信  │          │
│  └──────────────────────────────┘          │
└─────────────────────────────────────────────┘
                    │
                    ▼
          ┌──────────────────┐
          │  LINE Bot         │
          └────────┬──────────┘
                   │
                   ▼
          ┌──────────────────┐
          │  ユーザーのLINE  │
          │  「おはよう！     │
          │   今日のTodo」   │
          └──────────────────┘
```

---

## 使用技術の解説

### 1. **NestJS** (バックエンドフレームワーク)

**何？**: Node.jsでサーバーを作るためのフレームワーク  
**役割**: APIエンドポイント、データベース操作、スケジューラーの管理

**例え**: 家の「骨組み」や「配管」のようなもの。アプリ全体の構造を決める。

### 2. **@nestjs/schedule** (スケジューラー)

**何？**: 指定した時間に自動的に処理を実行するライブラリ  
**役割**: 「毎分0秒」に起動して、通知が必要なユーザーをチェック

**例え**: 目覚まし時計のようなもの。設定した時間になったら自動的に動く。

### 3. **Cron（クロン）**

**何？**: 時間を指定するための記法  
**記法例**:

- `0 * * * * *` = 毎分0秒
- `0 9 * * *` = 毎日9:00（※NestJSは秒単位も指定可能）

**例え**: 目覚まし時計の「時刻設定ダイヤル」

### 4. **Prisma** (データベースORM)

**何？**: データベースを操作するツール  
**役割**: ユーザー情報やTodoを取得・更新

**例え**: 図書館の「検索システム」。本（データ）を簡単に探せる。

### 5. **LINE Messaging API**

**何？**: LINEにメッセージを送るための仕組み  
**役割**: Bot経由でユーザーにメッセージを送信

---

## NestJS Schedulerとは

### 概要

NestJSが公式に提供するスケジューリング機能です。内部的には`node-cron`というライブラリを使っています。

### なぜ選んだのか？

| 理由                | 説明                                                       |
| ------------------- | ---------------------------------------------------------- |
| ✅ **シンプル**     | NestJSに組み込まれているため、追加のサーバーやサービス不要 |
| ✅ **無料**         | 追加コストなし                                             |
| ✅ **即座に動作**   | アプリ起動と同時にスケジューラーが稼働                     |
| ✅ **保守しやすい** | TypeScriptで一元管理できる                                 |
| ✅ **学習コスト低** | NestJSの経験があればすぐ理解できる                         |

### 代替案との比較

| 方式                    | メリット           | デメリット         | コスト    |
| ----------------------- | ------------------ | ------------------ | --------- |
| **NestJS Scheduler** ✅ | シンプル、すぐ動く | 単一サーバー前提   | 無料      |
| **Bull/BullMQ**         | 堅牢、高性能       | Redisサーバー必須  | Redis料金 |
| **GitHub Actions Cron** | サーバー負荷ゼロ   | 外部依存、精度低い | 無料      |
| **Vercel Cron**         | 簡単、無料枠あり   | 実行時間制限       | 制限あり  |
| **AWS EventBridge**     | 大規模対応         | AWSアカウント必須  | 有料      |

---

## システム構成図

### データフロー

```
┌─────────────────────────────────────────────────────────┐
│  毎分0秒                                                 │
└────┬────────────────────────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│ NotificationScheduler                │
│ @Cron('0 * * * * *')                 │  ← スケジューラー起動
└────┬─────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│ 1. 現在時刻を取得 (日本時間)         │
│    例: 09:00                          │
└────┬─────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│ 2. Prismaでユーザー検索               │
│    WHERE notificationTime = '09:00'   │
│    AND lineMessagingId IS NOT NULL    │  ← LINE連携済みのみ
└────┬─────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│ 3. 各ユーザーに対してループ          │
└────┬─────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│ 4. NotificationService.sendTodayTodos│
│    - 本日のTodoを取得                 │
│    - メッセージを生成                 │
│    - LINE Messaging APIで送信         │
└──────────────────────────────────────┘
```

### ファイル構成

```
backend/src/
├── notification/
│   ├── notification.module.ts         # モジュール定義
│   ├── notification.service.ts        # 送信ロジック（既存）
│   ├── notification.controller.ts     # 手動送信API（既存）
│   └── notification.scheduler.ts      # ⭐ 新規作成（スケジューラー）
├── prisma.service.ts
├── app.module.ts                       # ScheduleModule追加
└── main.ts
```

---

## 実装の流れ

### ステップ1: パッケージのインストール

```bash
cd backend
npm install @nestjs/schedule
```

**なぜ必要？**: NestJSのスケジューリング機能を使うため

---

### ステップ2: `AppModule`にScheduleModuleを追加

```typescript
// backend/src/app.module.ts
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(), // ⭐ 追加
    TodoModule,
    AuthModule,
    NotificationModule,
    LineModule,
  ],
  providers: [PrismaService],
})
export class AppModule {}
```

**役割**: スケジューラー機能を有効化

---

### ステップ3: スケジューラークラスを作成

新しいファイルを作成します。

```typescript
// backend/src/notification/notification.scheduler.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import { NotificationService } from './notification.service';

@Injectable()
export class NotificationScheduler {
  private readonly logger = new Logger(NotificationScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * 毎分0秒に実行されるcronジョブ
   * 日本時間で現在時刻と一致するユーザーに通知を送信
   */
  @Cron('0 * * * * *', {
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
```

**重要ポイント**:

- `@Cron('0 * * * * *')`: 毎分0秒に実行
- `timeZone: 'Asia/Tokyo'`: 日本時間基準
- `Logger`: コンソールにログを出力（デバッグに便利）
- エラーハンドリング: 1人失敗しても他のユーザーへの送信は継続

---

### ステップ4: NotificationModuleに登録

```typescript
// backend/src/notification/notification.module.ts
import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationScheduler } from './notification.scheduler'; // ⭐ 追加
import { PrismaService } from '../prisma.service';
import { LineService } from '../line/line.service';
import { TodoService } from '../todo/todo.service';

@Module({
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationScheduler, // ⭐ 追加
    PrismaService,
    LineService,
    TodoService,
  ],
})
export class NotificationModule {}
```

---

### ステップ5: 起動して確認

```bash
npm run start:dev
```

**ログ例**:

```
[NotificationScheduler] スケジューラー起動: 現在時刻 09:00
[NotificationScheduler] 2名のユーザーに通知を送信開始
[NotificationScheduler] ✅ ユーザー 1 (太郎) に送信成功
[NotificationScheduler] ✅ ユーザー 3 (花子) に送信成功
[NotificationScheduler] 通知送信完了: 2名
```

---

## コード詳細解説

### Cron式の読み方

```
@Cron('0 * * * * *')
       │ │ │ │ │ │
       │ │ │ │ │ └─ 曜日 (0-6, 日曜=0)
       │ │ │ │ └─── 月 (1-12)
       │ │ │ └───── 日 (1-31)
       │ │ └─────── 時 (0-23)
       │ └───────── 分 (0-59)
       └─────────── 秒 (0-59) ⭐ NestJSのみ対応
```

**よく使う例**:

- `0 * * * * *` = 毎分0秒
- `0 0 9 * * *` = 毎日9:00
- `0 30 8 * * 1-5` = 平日の8:30

### タイムゾーン処理

```typescript
const formatter = new Intl.DateTimeFormat('ja-JP', {
  timeZone: 'Asia/Tokyo',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});
```

**なぜ必要？**  
サーバーがUTC（世界標準時）で動いていても、日本時間で判定するため。

**例**:

- サーバー時刻: `00:00 UTC`
- 日本時間: `09:00 JST` ← これを取得

### エラーハンドリング

```typescript
for (const user of users) {
  try {
    await this.notificationService.sendTodayTodos(user.id);
  } catch (error) {
    // 1人失敗しても続行
    this.logger.error(`ユーザー ${user.id} への送信失敗`, error);
  }
}
```

**メリット**: 1人のエラーで全体が止まらない

---

## 動作確認方法

### 方法1: 手動で時刻を変更してテスト

```typescript
// notification.scheduler.ts の getCurrentTimeInJST() を一時的に変更
private getCurrentTimeInJST(): string {
  return '09:00'; // 固定値でテスト
}
```

サーバーを起動すると、毎分「09:00」として判定されるため、`notificationTime = '09:00'`のユーザーに送信される。

### 方法2: Cron式を変更して短時間テスト

```typescript
@Cron('*/10 * * * * *') // 10秒ごとに実行
```

**注意**: テスト後は元に戻す！

### 方法3: ログで確認

```bash
npm run start:dev
```

コンソールに以下のログが出力されるか確認：

```
[NotificationScheduler] スケジューラー起動: 現在時刻 14:23
[NotificationScheduler] 14:23 に通知予定のユーザーはいません
```

---

## トラブルシューティング

### ❌ スケジューラーが動かない

**原因**: `ScheduleModule`が追加されていない

**解決策**:

```typescript
// app.module.ts
imports: [
  ScheduleModule.forRoot(), // これを追加
  // ...
];
```

---

### ❌ 「TypeError: Cannot read property 'sendTodayTodos'」

**原因**: `NotificationService`が注入されていない

**解決策**:

```typescript
// notification.module.ts
providers: [
  NotificationService,
  NotificationScheduler, // これを追加
  // ...
];
```

---

### ❌ 時刻がずれている

**原因**: タイムゾーンが設定されていない

**解決策**:

```typescript
@Cron('0 * * * * *', {
  timeZone: 'Asia/Tokyo', // これを追加
})
```

---

### ❌ 通知が重複送信される

**原因**: 同じ分内に複数回実行されている

**解決策**: Cron式を確認。秒を`0`に固定。

```typescript
@Cron('0 * * * * *') // ⭐ 秒は0のみ
```

---

### ❌ ユーザーが見つからない

**原因1**: `lineMessagingId`がnull（LINE連携していない）

**確認方法**:

```sql
SELECT id, lineDisplayName, lineMessagingId, notificationTime
FROM "User"
WHERE notificationTime = '09:00';
```

**原因2**: 時刻フォーマットが不一致

- データベース: `09:00`
- 取得値: `9:00` ← ゼロパディングがない

**解決策**: `hour.padStart(2, '0')` を使用（コード内で実施済み）

---

## 拡張案

### 1. 送信済みフラグを追加

同じ日に複数回送信しないようにする。

```prisma
model User {
  // ...
  lastNotificationSent DateTime?
}
```

```typescript
// スケジューラー内
const today = new Date().toISOString().split('T')[0]; // "2026-02-02"

const users = await this.prisma.user.findMany({
  where: {
    notificationTime: currentTime,
    lineMessagingId: { not: null },
    OR: [
      { lastNotificationSent: null },
      { lastNotificationSent: { lt: new Date(today) } }, // 今日より前
    ],
  },
});

// 送信後に更新
await this.prisma.user.update({
  where: { id: user.id },
  data: { lastNotificationSent: new Date() },
});
```

### 2. 並列処理で高速化

```typescript
await Promise.all(
  users.map(async (user) => {
    try {
      await this.notificationService.sendTodayTodos(user.id);
    } catch (error) {
      this.logger.error(`ユーザー ${user.id} への送信失敗`, error);
    }
  }),
);
```

### 3. 通知設定のオン・オフ

```prisma
model User {
  notificationEnabled Boolean @default(true)
}
```

```typescript
where: {
  notificationTime: currentTime,
  notificationEnabled: true, // ⭐ 追加
  lineMessagingId: { not: null },
}
```

---

## まとめ

| 項目               | 内容                                               |
| ------------------ | -------------------------------------------------- |
| **使用技術**       | NestJS Scheduler + Cron                            |
| **実行タイミング** | 毎分0秒                                            |
| **対象ユーザー**   | `notificationTime` が現在時刻と一致 & LINE連携済み |
| **送信内容**       | 本日のTodo一覧                                     |
| **エラー対応**     | 個別にキャッチ、全体は継続                         |
| **ログ**           | 送信成功/失敗を記録                                |

### 次のステップ

1. ✅ スケジューラーの実装
2. ✅ 動作確認
3. 🔲 本番環境へのデプロイ
4. 🔲 モニタリング設定（エラー通知）
5. 🔲 パフォーマンスチューニング

---

**作成日**: 2026年2月2日  
**対象バージョン**: NestJS v11, @nestjs/schedule v4
