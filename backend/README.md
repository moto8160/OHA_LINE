<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

おはLINE アプリケーションのバックエンドAPIサーバー。

NestJS + Prisma + PostgreSQL を使用して構築されています。

## 機能

- TodoのCRUD操作
- ユーザー管理（現在は固定ユーザー）
- データベース管理（Prisma）

詳細な実装内容は [docs/BACKEND_IMPLEMENTATION.md](./docs/BACKEND_IMPLEMENTATION.md) を参照してください。

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env` ファイルを作成し、以下を設定してください：

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/db"
```

### 3. データベースマイグレーション

```bash
# マイグレーション実行
npx prisma migrate dev

# Prismaクライアント生成
npx prisma generate
```

### 4. 開発サーバー起動

```bash
npm run start:dev
```

サーバーは `http://localhost:5000` で起動します。

## 開発コマンド

```bash
# 開発モード（ウォッチモード）
npm run start:dev

# 本番モード
npm run start:prod

# ビルド
npm run build

# テスト
npm run test
npm run test:e2e
npm run test:cov

# リント
npm run lint

# フォーマット
npm run format
```

## API エンドポイント

詳細は [docs/BACKEND_IMPLEMENTATION.md](./docs/BACKEND_IMPLEMENTATION.md) を参照してください。

### Todo関連

- `GET /todos` - すべてのTodoを取得
- `POST /todos` - 新しいTodoを登録
- `GET /todos/by-date?date=YYYY-MM-DD` - 指定日付のTodoを取得

## データベース

Prismaを使用してデータベースを管理しています。

```bash
# Prisma Studio（GUI）を起動
npx prisma studio

# マイグレーション作成
npx prisma migrate dev --name migration_name

# マイグレーション適用
npx prisma migrate deploy
```

詳細は [docs/DATABASE_DESIGN.md](./docs/DATABASE_DESIGN.md) を参照してください。

## 参考資料

- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
