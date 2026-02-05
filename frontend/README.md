# おはLINE フロントエンド

おはLINE アプリケーションのフロントエンド。Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS で構築されています。

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local` ファイルを作成し、以下を設定してください：

```env
NEXT_PUBLIC_API_BASE=http://localhost:5000
```

### 3. 開発サーバー起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# 本番ビルド
npm run build

# 本番サーバー起動
npm run start

# リント
npm run lint
```

## プロジェクト構成

```
src/
├── app/
│   ├── page.tsx        # メインページ
│   ├── layout.tsx      # レイアウト
│   └── globals.css     # グローバルスタイル
├── components/
│   ├── TodoForm.tsx    # Todo登録フォーム
│   └── TodoList.tsx    # Todo一覧表示
└── types/
    └── todo.ts         # Todo型定義
```

## 機能

- ✅ Todo登録フォーム
- ✅ Todo一覧表示（日付別グループ化）
- ✅ レスポンシブデザイン

## 参考資料

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
