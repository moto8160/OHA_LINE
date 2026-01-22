# LineNotice

毎朝のTodo通知アプリケーション。指定した日付のTodoを登録し、朝の指定時刻にLINEメッセージで通知を受け取ることができます。

## プロジェクト概要

LineNoticeは、以下の機能を提供するWebアプリケーションです：

- **Todo管理**: 日付ごとにTodoを登録・管理
- **LINE通知**（開発中）: 指定時刻に本日のTodo一覧をLINEで通知
- **天気予報**（予定）: 通知に天気情報を含める
- **AIからの一言**（予定）: 通知に励ましのメッセージを含める

## 技術スタック

### フロントエンド
- **Next.js 16** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS 4**

### バックエンド
- **NestJS 11**
- **Prisma 6**
- **PostgreSQL 16** (Docker)

## プロジェクト構成

```
LineNotice/
├── frontend/          # Next.js フロントエンド
├── backend/           # NestJS バックエンド
├── docker-compose.yml # PostgreSQL コンテナ設定
├── PROJECT_ROADMAP.md # 開発ロードマップ
└── DOCKER_SETUP.md    # Docker セットアップガイド
```

## セットアップ手順

### 前提条件

- Node.js (v18以上推奨)
- Docker Desktop
- npm または yarn

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd LineNotice
```

### 2. データベースの起動

```bash
docker-compose up -d
```

詳細は [DOCKER_SETUP.md](./DOCKER_SETUP.md) を参照してください。

### 3. バックエンドのセットアップ

```bash
cd backend
npm install

# 環境変数の設定
# .env ファイルを作成し、以下を設定:
# DATABASE_URL="postgresql://postgres:password@localhost:5432/db"

# Prismaマイグレーション実行
npx prisma migrate dev

# Prismaクライアント生成
npx prisma generate

# 開発サーバー起動
npm run start:dev
```

バックエンドは `http://localhost:5000` で起動します。

詳細は [backend/README.md](./backend/README.md) を参照してください。

### 4. フロントエンドのセットアップ

```bash
cd frontend
npm install

# 環境変数の設定
# .env.local ファイルを作成し、以下を設定:
# NEXT_PUBLIC_API_BASE=http://localhost:5000

# 開発サーバー起動
npm run dev
```

フロントエンドは `http://localhost:3000` で起動します。

詳細は [frontend/README.md](./frontend/README.md) を参照してください。

## 使用方法

1. ブラウザで `http://localhost:3000` にアクセス
2. 「Todoの内容」と「日付」を入力してTodoを登録
3. 登録したTodoが一覧に表示されます

## API エンドポイント

### Todo関連

- `GET /todos` - すべてのTodoを取得
- `POST /todos` - 新しいTodoを登録
  ```json
  {
    "title": "レポート提出",
    "date": "2026-01-20"
  }
  ```
- `GET /todos/by-date?date=2026-01-20` - 指定日付のTodoを取得

詳細は [backend/docs/BACKEND_IMPLEMENTATION.md](./backend/docs/BACKEND_IMPLEMENTATION.md) を参照してください。

## データベース設計

詳細は [backend/docs/DATABASE_DESIGN.md](./backend/docs/DATABASE_DESIGN.md) を参照してください。

### 主要テーブル

- **User**: LINE認証済みユーザー情報
- **Todo**: ユーザーが登録したTodo

## 開発状況

現在の実装状況は [PROJECT_ROADMAP.md](./PROJECT_ROADMAP.md) を参照してください。

### 実装済み機能

- ✅ Todo登録機能
- ✅ Todo一覧表示機能
- ✅ データベース設計・実装

### 開発中・予定機能

- 🚧 LINE通知機能（手動実行）
  - 実装ガイド: [backend/docs/LINE_NOTIFICATION_IMPLEMENTATION.md](./backend/docs/LINE_NOTIFICATION_IMPLEMENTATION.md)
  - フロントエンド実装: [frontend/docs/LINE_NOTIFICATION_FRONTEND.md](./frontend/docs/LINE_NOTIFICATION_FRONTEND.md)
- 📅 天気予報統合
- 🤖 AIからの一言機能
- 📝 Todo編集・削除機能
- ⏰ 自動スケジューラー（指定時刻に自動送信）

## 機能実装ガイド

### LINE通知機能の実装

LINE通知機能を実装する場合は、以下のドキュメントを参照してください：

- **バックエンド実装**: [backend/docs/LINE_NOTIFICATION_IMPLEMENTATION.md](./backend/docs/LINE_NOTIFICATION_IMPLEMENTATION.md)
- **フロントエンド実装**: [frontend/docs/LINE_NOTIFICATION_FRONTEND.md](./frontend/docs/LINE_NOTIFICATION_FRONTEND.md)

## トラブルシューティング

### Invalid Date エラー

Todo一覧で「Invalid Date」が表示される場合、ブラウザのコンソールを確認してください。日付のパースエラーが発生している可能性があります。

### データベース接続エラー

1. Dockerコンテナが起動しているか確認: `docker-compose ps`
2. 環境変数 `DATABASE_URL` が正しく設定されているか確認
3. ポート5432が使用可能か確認

### LINE通知エラー

LINE通知が送信できない場合：

1. LINE Developersコンソールでチャネルアクセストークンが正しく設定されているか確認
2. 環境変数 `LINE_CHANNEL_ACCESS_TOKEN` が設定されているか確認
3. LINE Botを友だち追加しているか確認
4. バックエンドサーバーのログを確認

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。
