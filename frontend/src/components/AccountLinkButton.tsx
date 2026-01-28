'use client';

import { useState } from 'react';
import { linkApi } from '@/services/api';

interface LinkInfo {
  linkUrl: string;
  expiresAt: string;
}

export function AccountLinkButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [linkInfo, setLinkInfo] = useState<LinkInfo | null>(null);
  const [error, setError] = useState('');
  const [showQRModal, setShowQRModal] = useState(false);

  const handleGenerateLink = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await linkApi.generateLinkToken();
      setLinkInfo(response);
    } catch (err) {
      setError('連携トークンの生成に失敗しました');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (linkInfo) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-lg">
        <h2 className="text-lg font-bold text-blue-900 mb-4">LINEアカウント連携</h2>

        <p className="text-sm text-gray-700 mb-4">
          以下のリンクをLINEで開くか、QRコードをスキャンして、Botを友達追加してアカウント連携を完了してください。
        </p>

        {/* リンク表示 */}
        <div className="bg-white border border-gray-300 rounded p-3 mb-4 break-all">
          <p className="text-xs text-gray-500 mb-1">連携リンク:</p>
          <a
            href={linkInfo.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline text-sm"
          >
            {linkInfo.linkUrl}
          </a>
        </div>

        {/* QRコード表示ボタン */}
        <button
          onClick={() => setShowQRModal(!showQRModal)}
          className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded mb-4 text-sm"
        >
          {showQRModal ? 'QRコードを隠す' : 'QRコードを表示'}
        </button>

        {showQRModal && (
          <div className="bg-white border border-gray-300 rounded p-4 mb-4 text-center">
            <p className="text-xs text-gray-500 mb-3">このQRコードをLINEカメラでスキャン</p>
            {/* 本来はqrcode.reactなどで生成、ここはプレースホルダー */}
            <div className="w-48 h-48 mx-auto bg-gray-200 rounded flex items-center justify-center text-gray-400">
              QRコード（生成中）
            </div>
          </div>
        )}

        {/* 手順案内 */}
        <div className="bg-white border border-gray-300 rounded p-4 text-sm">
          <p className="font-bold mb-2">手順:</p>
          <ol className="list-decimal list-inside space-y-1 text-gray-700">
            <li>上のリンクをLINEで開く</li>
            <li>「LineNotice」Botを友達追加</li>
            <li>Botからのアカウント連携ボタンをタップ</li>
            <li>「アカウント連携」ボタンをタップして完了</li>
          </ol>
          <p className="text-xs text-gray-500 mt-3">
            有効期限: {new Date(linkInfo.expiresAt).toLocaleString('ja-JP')}
          </p>
        </div>

        <button
          onClick={() => {
            setLinkInfo(null);
            setError('');
          }}
          className="w-full mt-4 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded text-sm"
        >
          キャンセル
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={handleGenerateLink}
        disabled={isLoading}
        className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded text-sm"
      >
        {isLoading ? '生成中...' : 'アカウント連携を開始'}
      </button>

      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
}
