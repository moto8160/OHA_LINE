# バックエンド実装ガイド

## 概要

おはLINEのバックエンドは、NestJS + Prisma + PostgreSQL で構成されています。LINE OAuth認証、Todo管理、LINE通知（自動/手動）を提供します。

## 技術スタック

- NestJS 11
- Prisma 6
- PostgreSQL 16
- @nestjs/schedule（Cron）
- LINE Messaging API
- Open-Meteo API（天気情報）

## 環境変数

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/db"
JWT_SECRET=your_jwt_secret
LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token
FRONTEND_URL=http://localhost:3000
```

## 認証エンドポイント

| Method | Path                    | 説明                    | 認証 |
| ------ | ----------------------- | ----------------------- | ---- |
| GET    | /auth/line              | LINE OAuth 開始         | 不要 |
| GET    | /auth/line/callback     | LINE OAuth コールバック | 不要 |
| GET    | /auth/me                | 現在のユーザー情報      | 必要 |
| PATCH  | /auth/notification-time | 通知時刻の更新（HH:mm） | 必要 |

## Todoエンドポイント

| Method | Path                           | 説明                   | 認証 |
| ------ | ------------------------------ | ---------------------- | ---- |
| GET    | /todos                         | Todo一覧               | 必要 |
| GET    | /todos/by-date?date=YYYY-MM-DD | 指定日のTodo           | 必要 |
| POST   | /todos                         | Todo作成               | 必要 |
| DELETE | /todos/:id                     | Todo削除               | 必要 |
| PATCH  | /todos/:id/status              | 完了状態の更新         | 必要 |
| DELETE | /todos/completed               | 完了済みTodoの一括削除 | 必要 |

## 通知エンドポイント

| Method | Path                | 説明                     | 認証 |
| ------ | ------------------- | ------------------------ | ---- |
| POST   | /notifications/send | 翌日のTodo通知を手動送信 | 必要 |

## LINE Webhook

| Method | Path          | 説明             | 認証 |
| ------ | ------------- | ---------------- | ---- |
| POST   | /line/webhook | LINEイベント受信 | 不要 |

## 通知ロジック

### sendTodos(userId, 'today' | 'tomorrow')

- 指定ユーザーのTodoを取得
- メッセージを組み立ててLINEへ送信
- 送信時のヘッダーは常に「今日のTodo」

### メッセージ内容

- 今日のTodo一覧
- 天気情報（Open-Meteo / 5都市）
- 祝日情報（該当日があれば追加）
- 雑学（ランダム）
- 励ましのひとこと（30種の固定クォート）

## スケジューラー

- Cron: `0 * * * * *`（毎分0秒）
- タイムゾーン: `Asia/Tokyo`
- `notificationTime` が現在時刻と一致するユーザーに送信

詳細は [SCHEDULER_IMPLEMENTATION.md](./SCHEDULER_IMPLEMENTATION.md) を参照してください。

## 参考資料

- [LINE Messaging API](https://developers.line.biz/ja/docs/messaging-api/)
- [Open-Meteo](https://open-meteo.com/)
- [NestJS](https://docs.nestjs.com/)
