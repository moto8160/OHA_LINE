# フロントエンド LINE通知機能ガイド

## 概要

フロントエンドでは、認証済みユーザーが「翌日のTodo通知」を手動で送信できるボタンを提供しています。

- 対象コンポーネント: `LineNotificationButton`
- 呼び出しAPI: `POST /notifications/send`
- 認証: JWT（Cookie内のトークン）

## UI概要

- 送信ボタンをクリックすると、翌日のTodo通知がLINEに送信されます
- 送信中はローディング表示
- 送信成功/失敗のメッセージを表示

## 実装箇所

- 画面: Home（`src/app/page.tsx`）
- ボタン: `src/components/LineNotificationButton.tsx`
- API: `src/services/api.ts`

## 送信フロー

1. ユーザーが「LINE通知テスト送信」ボタンをクリック
2. `notificationApi.send()` が呼ばれる
3. バックエンドで `sendTodos(userId, 'tomorrow')` を実行
4. LINEに翌日のTodo通知が届く

## 注意点

- LINE連携（`lineMessagingId`の登録）が済んでいない場合、送信は失敗します
- トークン期限（30日）を過ぎた場合は再ログインが必要です

## 関連ドキュメント

- [LINE通知機能実装ガイド](../../backend/docs/LINE_NOTIFICATION_IMPLEMENTATION.md)
- [スケジューラー実装ガイド](../../backend/docs/SCHEDULER_IMPLEMENTATION.md)
