'use client';

import { useState } from 'react';
import { notificationApi } from '@/services/api';

interface LineNotificationButtonProps {
  userId?: number;
  isLinked?: boolean;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export function LineNotificationButton({
  userId,
  isLinked = false,
  onSuccess,
  onError,
}: LineNotificationButtonProps) {
  const [sending, setSending] = useState(false);

  const handleSendNotification = async () => {
    if (!userId || !isLinked) return;
    setSending(true);

    try {
      await notificationApi.sendTodayTodos();
      onSuccess?.('LINE通知を送信しました！');
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'LINE送信に失敗しました');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mt-8">
      <button
        onClick={handleSendNotification}
        disabled={sending || !isLinked}
        className={`w-full text-white font-semibold py-3 px-4 rounded-lg shadow-md transition-colors flex items-center justify-center ${
          isLinked ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'
        }`}
      >
        {sending ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            送信中...
          </>
        ) : isLinked ? (
          <>📱 本日のTodoを試しに送信</>
        ) : (
          <>📱 本日のTodoを試しに送信</>
        )}
      </button>
      {!isLinked && (
        <p className="text-xs text-gray-500 mt-3 text-center">
          先にLINEの友だち追加を完了してください。
        </p>
      )}
    </div>
  );
}
