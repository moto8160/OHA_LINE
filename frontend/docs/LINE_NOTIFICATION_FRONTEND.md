# フロントエンドからのLINE通知送信実装ガイド

## 概要

このドキュメントでは、フロントエンドからLINE通知を送信する機能を追加する手順を説明します。

## 実装手順

### ステップ1: 通知送信ボタンの追加

`frontend/src/app/page.tsx` に通知送信機能を追加します。

#### 1.1 状態管理の追加

```typescript
const [sendingNotification, setSendingNotification] = useState(false);
const [notificationMessage, setNotificationMessage] = useState('');
```

#### 1.2 通知送信関数の実装

```typescript
const handleSendNotification = async () => {
  setSendingNotification(true);
  setNotificationMessage('');
  setError('');

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/notifications/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || '通知の送信に失敗しました');
    }

    setNotificationMessage('LINE通知を送信しました！');
    setTimeout(() => setNotificationMessage(''), 3000);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'エラーが発生しました');
  } finally {
    setSendingNotification(false);
  }
};
```

#### 1.3 UIコンポーネントの追加

`TodoForm`の下に通知送信ボタンを追加：

```typescript
<div className="bg-white rounded-lg shadow-md p-6 mb-8">
  <h2 className="text-lg font-semibold text-gray-900 mb-4">LINE通知</h2>
  
  {notificationMessage && (
    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
      <p className="text-sm text-green-700">{notificationMessage}</p>
    </div>
  )}

  <button
    onClick={handleSendNotification}
    disabled={sendingNotification}
    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors"
  >
    {sendingNotification ? '送信中...' : '📱 本日のTodoをLINEに送信'}
  </button>
</div>
```

### ステップ2: 通知コンポーネントの作成（オプション）

より再利用可能にするため、専用コンポーネントを作成することもできます。

**`frontend/src/components/NotificationButton.tsx`** を作成：

```typescript
'use client';

import { useState } from 'react';

interface NotificationButtonProps {
  apiBase: string;
}

export function NotificationButton({ apiBase }: NotificationButtonProps) {
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSend = async () => {
    setSending(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch(`${apiBase}/notifications/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || '通知の送信に失敗しました');
      }

      setMessage('LINE通知を送信しました！');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">LINE通知</h2>
      
      {message && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">{message}</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <button
        onClick={handleSend}
        disabled={sending}
        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors"
      >
        {sending ? '送信中...' : '📱 本日のTodoをLINEに送信'}
      </button>
    </div>
  );
}
```

**`frontend/src/app/page.tsx`** で使用：

```typescript
import { NotificationButton } from '@/components/NotificationButton';

// ... 既存のコード ...

<NotificationButton apiBase={process.env.NEXT_PUBLIC_API_BASE || ''} />
```

## 動作確認

1. フロントエンドサーバーを起動：
   ```bash
   cd frontend
   npm run dev
   ```

2. ブラウザで `http://localhost:3000` にアクセス

3. 「📱 本日のTodoをLINEに送信」ボタンをクリック

4. LINEアプリで通知が届くことを確認

## 注意事項

- LINE Botを友だち追加していない場合、通知は送信できません
- バックエンドサーバーが起動している必要があります
- 環境変数 `NEXT_PUBLIC_API_BASE` が正しく設定されている必要があります
