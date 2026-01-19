# バックエンド実装ガイド

## 実装内容

### ファイル構成

```
backend/src/
├── todo/
│   ├── dto/
│   │   └── create-todo.dto.ts
│   ├── todo.controller.ts
│   └── todo.service.ts
├── user/
│   └── user.service.ts
├── app.module.ts
├── prisma.service.ts
└── main.ts
```

## ユーザー固定値

`user.service.ts` で以下の固定値を定義しています：

```typescript
const FIXED_USER_ID = 1;
const FIXED_USER = {
  lineUserId: 'U1234567890abcdef1234567890abcdef',
  lineToken: 'dummy_token_for_development',
  notificationTime: '09:00',
};
```

- **FIXED_USER_ID**: 1（固定ユーザーID）
- **lineUserId**: ダミーのLINE User ID
- **lineToken**: 開発用ダミートークン
- **notificationTime**: 09:00（朝9時に通知）

## エンドポイント

### 1. Todo登録

**POST** `/todos`

**リクエストボディ:**

```json
{
  "title": "レポート提出",
  "date": "2026-01-20"
}
```

**レスポンス:**

```json
{
  "id": 1,
  "userId": 1,
  "title": "レポート提出",
  "date": "2026-01-20",
  "isCompleted": false,
  "createdAt": "2026-01-19T10:30:00Z",
  "updatedAt": "2026-01-19T10:30:00Z"
}
```

### 2. すべてのTodo取得

**GET** `/todos`

**レスポンス:**

```json
[
  {
    "id": 1,
    "userId": 1,
    "title": "レポート提出",
    "date": "2026-01-20",
    "isCompleted": false,
    "createdAt": "2026-01-19T10:30:00Z",
    "updatedAt": "2026-01-19T10:30:00Z"
  }
]
```

### 3. 指定日付のTodo取得

**GET** `/todos/by-date?date=2026-01-20`

**レスポンス:**

```json
[
  {
    "id": 1,
    "userId": 1,
    "title": "レポート提出",
    "date": "2026-01-20",
    "isCompleted": false,
    "createdAt": "2026-01-19T10:30:00Z",
    "updatedAt": "2026-01-19T10:30:00Z"
  }
]
```

## セットアップ手順

### 1. Prismaマイグレーション実行

```bash
cd backend
npx prisma migrate dev --name init_todo_schema
```

### 2. Prismaクライアント再生成

```bash
npx prisma generate
```

### 3. バックエンド起動

```bash
npm run start:dev
```

### 4. ユーザー初期化（初回のみ）

TodoService の任意のメソッドを呼び出すと、自動的にユーザーが存在しなければ作成されます。

または、別途初期化エンドポイントを追加することもできます：

```bash
POST /users/initialize
```

## テスト用コマンド

### Todo登録

```bash
curl -X POST http://localhost:5000/todos \
  -H "Content-Type: application/json" \
  -d '{
    "title": "朝食を食べる",
    "date": "2026-01-20"
  }'
```

### すべてのTodo取得

```bash
curl http://localhost:5000/todos
```

### 指定日付のTodo取得

```bash
curl "http://localhost:5000/todos/by-date?date=2026-01-20"
```

## 次のステップ

- [ ] Todo更新エンドポイント実装
- [ ] Todo削除エンドポイント実装
- [ ] Todo完了フラグ更新エンドポイント実装
- [ ] スケジューラー実装（指定時刻にLINE通知）
- [ ] LINE API連携（実際のメッセージ送信）
