'use client';

import { Suspense, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const token = useMemo(() => searchParams.get('token'), [searchParams]);
  const error = token ? null : '認証に失敗しました。トークンが見つかりません。';

  useEffect(() => {
    if (!token) {
      const timeoutId = setTimeout(() => {
        router.push('/login');
      }, 3000);
      return () => clearTimeout(timeoutId);
    }

    // login関数を使ってトークンを保存し、認証状態を更新
    login(token);

    // 少し待ってからリダイレクト（AuthContextの状態更新を待つ）
    const timeoutId = setTimeout(() => {
      router.push('/');
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [token, router, login]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">エラー</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">ログイン画面にリダイレクトしています...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">認証中...</h1>
        <p className="text-gray-600">しばらくお待ちください</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">認証中...</h1>
            <p className="text-gray-600">しばらくお待ちください</p>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}

