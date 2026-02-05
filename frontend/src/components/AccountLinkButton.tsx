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
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-8 w-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            ✅
          </div>
          <h2 className="text-lg font-bold text-emerald-900">LINE連携済み</h2>
        </div>
        <p className="text-sm text-slate-700">
          友だち追加が完了しています。毎朝のLINE通知を受け取れます。
        </p>
      </div>
    );
  }

  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-8 w-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
          🤝
        </div>
        <h2 className="text-lg font-bold text-emerald-900">LINE通知を受け取る</h2>
      </div>

      <ol className="text-sm text-slate-700 mb-5 list-decimal list-inside space-y-2">
        <li>下のボタンからおはLINEを友だち追加</li>
        <li>この画面のトークンをLINEチャットに送信</li>
      </ol>

      <a
        href={lineUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-xl text-center shadow-sm"
      >
        おはLINEを友達追加
      </a>

      <div className="mt-5 bg-white border border-emerald-200 rounded-xl p-4">
        <p className="text-xs text-slate-500 mb-2">送信するトークン</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 overflow-x-auto">
            {lineToken ? `LINK:${lineToken}` : 'トークンを取得中...'}
          </code>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!lineToken}
            className="text-xs px-3 py-2 rounded-lg bg-slate-900 text-white disabled:bg-slate-400"
          >
            {copied ? 'コピー済み' : 'コピー'}
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-500 mt-4 text-center">友達追加後にLINEを受信できます。</p>
    </div>
  );
}
