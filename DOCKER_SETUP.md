# Docker PostgreSQL セットアップガイド

## 前提条件

- Docker Desktop がインストールされていること
- Docker Compose がインストールされていること（通常は Docker Desktop に含まれています）

## 初回セットアップ手順

### 1. PostgreSQL コンテナの起動

プロジェクトのルートディレクトリ（`docker-compose.yml` がある場所）で以下を実行：

```bash
docker-compose up -d
```

- `-d` フラグはバックグラウンド実行を意味します
- 初回は PostgreSQL イメージのダウンロードが行われるため、少し時間がかかります

### 2. コンテナが正常に起動したか確認

```bash
docker-compose ps
```

以下のような出力が表示されれば成功：

```
NAME       COMMAND                  SERVICE   STATUS      PORTS
postgres   "docker-entrypoint..."   db        Up 2 minutes 0.0.0.0:5432->5432/tcp
```

### 3. ログを確認（オプション）

起動状況の詳細ログを確認したい場合：

```bash
docker-compose logs db
```

## PostgreSQL への接続方法

### アプリケーション（Node.js など）から接続

```javascript
const connectionString = 'postgresql://postgres:password@localhost:5432/db';
// または
const connectionString = 'postgres://postgres:password@localhost:5432/db';
```

### コマンドラインから接続（psql）

```bash
psql -h localhost -U postgres -d db
```

パスワード（`password`）を入力してください。

### GUI ツール（DBeaver など）で接続

以下の設定で接続可能：

- **ホスト**: localhost
- **ポート**: 5432
- **ユーザー**: postgres
- **パスワード**: password
- **データベース**: db

## よく使うコマンド

### コンテナの停止

```bash
docker-compose stop
```

### コンテナの再起動

```bash
docker-compose restart
```

### コンテナの削除（注意：ボリュームは残る）

```bash
docker-compose down
```

### データベースデータも含めて完全に削除

```bash
docker-compose down -v
```

> ⚠️ このコマンドは全データを削除します。本番環境では実行しないでください。

## トラブルシューティング

### ポート 5432 が既に使用されている場合

`docker-compose.yml` の `ports` セクションを編集：

```yaml
ports:
  - '5433:5432' # ホスト側を 5433 に変更
```

その後、再度 `docker-compose up -d` を実行してください。

### コンテナが起動しない場合

ログを確認：

```bash
docker-compose logs db
```

エラーメッセージから原因を特定してください。

### データベースにアクセスできない場合

1. コンテナが実行中か確認

   ```bash
   docker-compose ps
   ```

2. ファイアウォール設定を確認
   - Windows ファイアウォールが 5432 ポートをブロックしていないか確認

3. 接続文字列を確認
   - ホストが `localhost` または `127.0.0.1` になっているか確認

## 設定のカスタマイズ

`docker-compose.yml` の `environment` セクションで以下を変更可能：

```yaml
environment:
  POSTGRES_USER: postgres # ユーザー名を変更
  POSTGRES_PASSWORD: password # パスワードを変更
  POSTGRES_DB: db # データベース名を変更
```

変更後は `docker-compose up -d` で再起動してください。

## Docker Desktop でのコンテナ管理

Docker Desktop の GUI から以下が可能：

- コンテナの起動・停止
- ログの確認
- コンテナ内のファイル参照
- パフォーマンス監視

Docker Desktop アプリを開いて **Containers** タブを確認してください。

---

トラブルが発生した場合は、`docker-compose logs db` でログを確認して、エラーメッセージを読んでみてください。
