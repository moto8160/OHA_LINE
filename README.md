# おはLINE

毎朝のTodo通知アプリケーション。指定した日付のTodoを登録し、朝の指定時刻にLINEメッセージで通知を受け取ることができます。

## プロジェクト概要

おはLINEは、以下の機能を提供するWebアプリケーションです：

- **Todo管理**: 日付ごとにTodoを登録・管理・完了状態を追跡
- **LINE通知**（✅ 完了）: 指定時刻に本日のTodo一覧をLINEで通知
- **天気予報**（✅ 完了）: 通知に天気情報を含める（5都市対応）
- **励ましのメッセージ**（✅ 完了）: 通知に30種類の動機付けクォートを含める

## 技術スタック

### フロントエンド

- **Next.js 14+** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS 4**
- **モバイルファースト設計**（最大幅: 28rem）

### バックエンド

- **NestJS 11**
- **Prisma 6**
- **PostgreSQL 16** (Docker)
- **NestJS Scheduler** (Cron: 毎分実行)

## プロジェクト構成

```
おはLINE/
├── frontend/          # Next.js フロントエンド
├── backend/           # NestJS バックエンド
├── docker-compose.yml # PostgreSQL コンテナ設定
├── PROJECT_ROADMAP.md # 開発ロードマップ
├── DOCKER_SETUP.md    # Docker セットアップガイド
└── README.md          # このファイル
```

## セットアップ手順

### 前提条件

- Node.js (v18以上推奨)
- Docker Desktop
- npm または yarn

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd おはLINE
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
# LINE_CHANNEL_ACCESS_TOKEN=your_token_here

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

### Webアプリケーション

1. ブラウザで `http://localhost:3000` にアクセス
2. 「LINE ログイン」をクリック
3. LINEアカウントで認証
4. 「Todoの内容」と「日付」を入力してTodoを登録
5. 登録したTodoが一覧に表示されます
6. チェックボックスで完了状態を変更
7. 「✓ 完了状態を更新」ボタンで一括保存

### 自動通知設定

1. プロフィール設定で通知時刻（HH:mm形式）を設定
2. 設定した時刻に毎日自動でTodo通知を受け取ります

## API エンドポイント

### 認証関連

- `GET /auth/line` - LINE OAuth 開始
- `GET /auth/line/callback` - LINE OAuth コールバック

### Todo関連

- `GET /todos` - すべてのTodoを取得（認証必須）
- `POST /todos` - 新しいTodoを登録
- `DELETE /todos/:id` - Todoを削除
- `PATCH /todos/:id/status` - Todoの完了状態を更新
- `DELETE /todos/completed` - 完了済みTodoを一括削除

### 通知関連

- `POST /notifications/send` - 翌日のTodo通知を手動送信

詳細は [backend/docs/BACKEND_IMPLEMENTATION.md](./backend/docs/BACKEND_IMPLEMENTATION.md) を参照してください。

## データベース設計

詳細は [backend/docs/DATABASE_DESIGN.md](./backend/docs/DATABASE_DESIGN.md) を参照してください。

### 主要テーブル

- **User**: LINE認証済みユーザー情報（lineLoginId/lineMessagingId、ユーザー名、通知時刻）
- **Todo**: ユーザーが登録したTodo（タイトル、日付、完了状態）

## 開発状況

### 実装済み機能 ✅

- ✅ Todo登録・削除・更新機能
- ✅ Todo一覧表示機能（日付ごとグループ化）
- ✅ 完了状態管理（チェックボックス、バッチ更新）
- ✅ データベース設計・実装（Prisma + PostgreSQL）
- ✅ LINE OAuth認証
- ✅ LINE Messaging API統合
- ✅ 自動通知スケジューラー（NestJS Scheduler、毎分実行）
- ✅ メッセージコンテンツ拡張
  - 本日のTodo一覧
  - 天気情報（5都市: 東京、京都、大阪、札幌、福岡）
  - トリビア（36種類）
  - 祝日情報（97日付）
  - 励ましのメッセージ（30種類のモチベーションクォート）
- ✅ 日付フォーマット表示（月日のみ）
- ✅ セッション延長（JWT: 30日、クッキー: 30日）
- ✅ モバイル最適化UI（ペンギンマスコット、柔らかい色使い）
- ✅ JSON解析エラーハンドリング

### 今後の予定機能

- 📅 定期Todoの自動生成機能
- 📊 Todo完了率の統計・グラフ表示
- 🔔 通知カスタマイズ（曜日ごとの設定など）
- 💾 データのエクスポート機能
- 🌙 ダークモード対応

## 機能実装ガイド

### LINE通知機能の詳細

LINE通知機能の実装、トラブルシューティングは、以下のドキュメントを参照してください：

- **バックエンド実装**: [backend/docs/LINE_NOTIFICATION_IMPLEMENTATION.md](./backend/docs/LINE_NOTIFICATION_IMPLEMENTATION.md)
- **フロントエンド実装**: [frontend/docs/LINE_NOTIFICATION_FRONTEND.md](./frontend/docs/LINE_NOTIFICATION_FRONTEND.md)
- **スケジューラー設計**: [backend/docs/SCHEDULER_IMPLEMENTATION.md](./backend/docs/SCHEDULER_IMPLEMENTATION.md)

### 認証システム

- **認証の詳細**: [backend/docs/AUTHENTICATION_DEEP_DIVE.md](./backend/docs/AUTHENTICATION_DEEP_DIVE.md)
- **LINE OAuth**: [backend/docs/LINE_OAUTH_GUIDE.md](./backend/docs/LINE_OAUTH_GUIDE.md)
- **LINE User ID**: [backend/docs/LINE_USER_ID_GUIDE.md](./backend/docs/LINE_USER_ID_GUIDE.md)

## トラブルシューティング

### Invalid Date エラー

Todo一覧で「Invalid Date」が表示される場合、ブラウザのコンソールを確認してください。日付のパースエラーが発生している可能性があります。

**解決策**: 日付フォーマットが `YYYY-MM-DD` であることを確認してください。

### データベース接続エラー

1. Dockerコンテナが起動しているか確認: `docker-compose ps`
2. 環境変数 `DATABASE_URL` が正しく設定されているか確認
3. ポート5432が使用可能か確認

### LINE通知エラー

LINE通知が送信できない場合：

1. LINE Developersコンソールでチャネルアクセストークンが正しく設定されているか確認
2. 環境変数 `LINE_CHANNEL_ACCESS_TOKEN` が設定されているか確認
3. LINE Botを友だち追加しているか確認
4. バックエンドサーバーのログを確認（`npm run start:dev` の出力）

詳細は [backend/docs/LINE_NOTIFICATION_IMPLEMENTATION.md](./backend/docs/LINE_NOTIFICATION_IMPLEMENTATION.md) を参照してください。

### スケジューラーが動作しない

スケジューラーが期待の時刻に実行されない場合：

1. バックエンドが起動しているか確認
2. `notificationTime` が正しく設定されているか確認（HH:mm形式）
3. サーバーのタイムゾーンが Asia/Tokyo に設定されているか確認
4. ログを確認: `[NotificationScheduler]` で始まるログを検索

詳細は [backend/docs/SCHEDULER_IMPLEMENTATION.md](./backend/docs/SCHEDULER_IMPLEMENTATION.md) を参照してください。

## セッション管理

### JWT トークン

- **有効期限**: 30日
- **保存場所**: ブラウザクッキー
- **フラグ**: `Secure` + `SameSite=Lax`

### クッキー

- **有効期限**: 30日
- **フラグ**: `Secure` + `SameSite=Lax`

詳細は [backend/docs/AUTHENTICATION_DEEP_DIVE.md](./backend/docs/AUTHENTICATION_DEEP_DIVE.md) を参照してください。

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## サポート

問題が発生した場合は、以下を確認してください：

1. [PROJECT_ROADMAP.md](./PROJECT_ROADMAP.md) で現在の実装状況を確認
2. 対応するドキュメントで解決方法を検索
3. バックエンドのコンソールログを確認
4. ブラウザの開発者ツール（F12キー）でクライアント側のエラーを確認
