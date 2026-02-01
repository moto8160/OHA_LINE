'use client';

export function AccountLinkButton() {
  const lineUrl = 'https://lin.ee/nIBIH71';

  
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-lg">
      <h2 className="text-lg font-bold text-green-900 mb-4">LINE通知を受け取る</h2>

      <p className="text-sm text-gray-700 mb-6">
        下のボタンをクリックして、LineNotice Botを友達追加してください。
      </p>

      <a
        href={lineUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded text-center"
      >
        🤖 LineNotice Botを友達追加
      </a>

      <p className="text-xs text-gray-500 mt-4 text-center">
        Botを友達追加すると、毎朝のTodo通知が自動的に有効になります。
      </p>
    </div>
  );
}
