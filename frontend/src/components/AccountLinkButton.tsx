'use client';

import { useState } from 'react';

type AccountLinkButtonProps = {
  isLinked?: boolean;
  lineToken?: string | null;
};

export function AccountLinkButton({ isLinked, lineToken }: AccountLinkButtonProps) {
  const lineUrl = 'https://lin.ee/nIBIH71';
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!lineToken) return;
    try {
      await navigator.clipboard.writeText(`LINK:${lineToken}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // no-op
    }
  };

  if (isLinked) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-lg">
        <h2 className="text-lg font-bold text-green-900 mb-2">LINE連携済み</h2>
        <p className="text-sm text-gray-700">
          友だち追加が完了しています。毎朝のTodo通知を受け取れます。
        </p>
      </div>
    );
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-lg">
      <h2 className="text-lg font-bold text-green-900 mb-4">LINE通知を受け取る</h2>

      <ol className="text-sm text-gray-700 mb-6 list-decimal list-inside space-y-2">
        <li>下のボタンからLineNotice Botを友だち追加</li>
        <li>この画面のトークンをLINEチャットに送信</li>
      </ol>

      <a
        href={lineUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded text-center"
      >
        🤖 LineNotice Botを友達追加
      </a>

      <div className="mt-5 bg-white border border-green-200 rounded p-4">
        <p className="text-xs text-gray-500 mb-2">送信するトークン</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded px-3 py-2 overflow-x-auto">
            {lineToken ? `LINK:${lineToken}` : 'トークンを取得中...'}
          </code>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!lineToken}
            className="text-xs px-3 py-2 rounded bg-gray-900 text-white disabled:bg-gray-400"
          >
            {copied ? 'コピー済み' : 'コピー'}
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-4 text-center">
        Botを友達追加すると、毎朝のTodo通知が自動的に有効になります。
      </p>
    </div>
  );
}
