# LINE Messaging ID取得ガイド

## 概要

LINE通知の送信先は **`lineMessagingId`（LINE Bot用のUser ID）** に保存されます。
このIDは、Webhook経由で取得し、**トークン連携**で自動的に登録されます。

## Webhook URLについて

**現在の実装では、Webhook URLの設定が必要です。**

LINE Botの友だち追加やメッセージ受信イベントを受け取り、`lineMessagingId` を自動登録します。

### 設定例

- 開発環境（ngrok等を使用）: `https://xxxx.ngrok-free.app/line/webhook`
- 本番環境: `https://yourdomain.com/line/webhook`

LINE Developers の「Messaging API」タブで以下を設定してください：

- Webhook URL: 上記のURL
- Webhookの利用: **有効**

## LINE Messaging IDの取得・連携手順

1. ✅ おはLINE Botを友だち追加
2. ✅ Webアプリの「LINE連携」セクションでトークンを取得
3. ✅ LINEチャットに `LINK:xxxxxx` を送信
4. ✅ 「連携が完了しました」と返ってくればOK

この時点で `lineMessagingId` がユーザーに紐づきます。

## 連携メッセージ例

```
LINK:4f3b2c1d-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

## 動作確認

- Webアプリの「LINE通知テスト送信」ボタン
- もしくは `POST /notifications/send` を利用（認証必須）

## トラブルシューティング

### LINE連携が完了しない

- Webhook URL が有効か確認
- Botを友だち追加しているか確認
- `LINK:` トークンが正しいか確認
- バックエンドのログを確認

### メッセージが届かない

- `LINE_CHANNEL_ACCESS_TOKEN` が正しいか確認
- `lineMessagingId` がDBに保存されているか確認
- スケジューラーが実行されているか確認
