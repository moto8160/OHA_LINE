# LINE User ID取得ガイド

## Webhook URLについて

**現在の実装では、Webhook URLの設定は不要です。**

手動実行による通知送信のみを実装しているため、Webhookは使用しません。
Webhook URLのフィールドは空のままで問題ありません。

将来的に自動応答機能を追加する場合は、公開されたHTTPS URLを設定する必要がありますが、現時点では設定不要です。

## LINE User IDの取得方法

### 方法1: LINE Developersコンソールで確認（推奨）

1. [LINE Developers](https://developers.line.biz/ja/) にログイン
2. 作成したチャネルを選択
3. 「Messaging API」タブを開く
4. 画面を下にスクロールして「友だち追加」セクションを確認
5. Botを友だち追加しているユーザーの一覧が表示されます
6. 各ユーザーの「User ID」をコピー

**注意**: この方法は、Botを友だち追加した後に表示されます。

### 方法2: Webhookを一時的に設定して取得（上級者向け）

1. 一時的にWebhook URLを設定（ngrokなどでローカルサーバーを公開）
2. Botにメッセージを送信
3. Webhookイベントのログから`source.userId`を確認

**注意**: この方法は複雑なため、方法1を推奨します。

### 方法3: LINE Bot SDKのプロファイル取得APIを使用

Botを友だち追加後、以下のエンドポイントでプロファイルを取得できますが、まずは方法1が最も簡単です。

## テスト用エンドポイント

LINE User IDが取得できたら、以下のエンドポイントでテストできます：

```bash
curl -X POST http://localhost:5000/notifications/test \
  -H "Content-Type: application/json" \
  -d '{
    "lineUserId": "YOUR_LINE_USER_ID",
    "message": "テストメッセージです"
  }'
```

または、メッセージを省略するとデフォルトメッセージが送信されます：

```bash
curl -X POST http://localhost:5000/notifications/test \
  -H "Content-Type: application/json" \
  -d '{
    "lineUserId": "YOUR_LINE_USER_ID"
  }'
```

## 手順まとめ

1. ✅ LINE Botを友だち追加（QRコードをスキャン）
2. ✅ LINE DevelopersコンソールでUser IDを確認
3. ✅ テストエンドポイントで固定メッセージを送信
4. ✅ LINEアプリでメッセージが届くことを確認

## トラブルシューティング

### User IDが表示されない場合

- Botを友だち追加しているか確認
- LINE Developersコンソールをリロード
- 別のLINEアカウントで試す

### メッセージが届かない場合

- LINE User IDが正しいか確認
- チャネルアクセストークンが正しく設定されているか確認
- Botを友だち追加しているか確認
- バックエンドサーバーのログを確認
