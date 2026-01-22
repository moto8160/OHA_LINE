# データベーススキーマ設計

## 概要

LineNoticeアプリケーションの最小限のデータベーススキーマ。ユーザーとTodoの2つのテーブルで構成。

ユーザーが指定した時刻（朝の一定時刻）に、その日のTodo一覧をLINE通知するシステム。

---

## テーブル設計

### 1. User テーブル

LINE認証済みユーザーの情報を管理するテーブル。

| フィールド名     | 型       | 制約                    | 説明                                       |
| ---------------- | -------- | ----------------------- | ------------------------------------------ |
| id               | Int      | PRIMARY KEY, AUTO INCR  | ユーザーの一意識別子                       |
| lineUserId       | String   | UNIQUE, NOT NULL        | LINEプラットフォーム内のユーザーID         |
| lineToken        | String   | NOT NULL                | LINEとのメッセージ送受信に使用するトークン |
| notificationTime | String   | DEFAULT: "09:00"        | 毎日Todoを通知する時刻（HH:mm形式）        |
| createdAt        | DateTime | DEFAULT: now()          | ユーザー作成日時                           |
| updatedAt        | DateTime | AUTO UPDATE             | 最終更新日時                               |

**リレーション:**

- `todos`: 1対多（このユーザーが作成したTodo）

**例:**

```
id: 1
lineUserId: U1234567890abcdef1234567890abcdef
lineToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
notificationTime: 09:00
```

---

### 2. Todo テーブル

ユーザーが登録したTodo（日々のタスク）を管理するテーブル。

| フィールド名 | 型       | 制約              | 説明                                   |
| ------------ | -------- | ----------------- | -------------------------------------- |
| id           | Int      | PRIMARY KEY, AUTO INCR | Todoの一意識別子                       |
| userId       | Int      | FOREIGN KEY       | このTodoの所有ユーザーID               |
| title        | String   | NOT NULL          | Todoのタイトル（例：「レポート提出」） |
| date         | DateTime | NOT NULL, @db.Date | このTodoを含める日付（日付のみ）       |
| isCompleted  | Boolean  | DEFAULT: false    | 完了済みかどうかのフラグ               |
| createdAt    | DateTime | DEFAULT: now()    | Todo作成日時                           |
| updatedAt    | DateTime | AUTO UPDATE       | 最終更新日時                           |

**リレーション:**

- `user`: 多対1（このTodoの所有者）

**ユニーク制約:**

- `[userId, title, date]`: 同じユーザーが同じ日に同じTodoを重複登録しないようにする

**インデックス:**

- `[userId, date]`: ユーザーの本日のTodo一覧を高速検索

**例:**

```
id: 1
userId: 1
title: レポート提出
date: 2026-01-20
isCompleted: false
```

---

## リレーション図

```
User (1) ──── (N) Todo

Todo には以下の関連を持つ:
  - userId (FK) → User.id
  - onDelete: Cascade (ユーザー削除時にTodoも削除)
```

---

## 設計のポイント

### 1. Userテーブル

- `lineUserId` は一意制約：1つのLINEアカウントは1ユーザーのみ
- `lineToken` でLINEメッセージを送信
- `notificationTime` : ユーザーが指定した毎日の通知時刻（朝の一定時刻）

### 2. Todoテーブル

- `date` が **Date型**（タイムスタンプなし）：「本日のTodo」を効率的に検索
- ユニーク制約 `[userId, title, date]`：同じ日に同じTodoは登録できない
- インデックス `[userId, date]`：ユーザーの本日のTodo一覧を高速検索

### 3. 通知フロー

1. スケジューラーが `User.notificationTime` で指定された時刻を監視
2. その時刻に達したら、該当ユーザーの本日（today）のTodo全件を取得
3. Todoをまとめてフォーマットして、LINE通知を送信

---

## 将来の拡張予定

- **天気予報機能**: User テーブルに位置情報フィールド追加
- **AI機能**: 送信履歴テーブル追加（デバッグ・監視用）
- **複数送信時刻**: User テーブルに複数時刻を指定可能に変更

---

## データベース初期化

```bash
# マイグレーション実行
npx prisma migrate dev --name init_todo_schema

# Prismaクライアント再生成
npx prisma generate

# データベーススキーマ確認
npx prisma studio
```
