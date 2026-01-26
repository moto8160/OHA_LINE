'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Todo } from '@/types/todo';
import { TodoForm } from '@/components/TodoForm';
import { TodoList } from '@/components/TodoList';
import { LineNotificationButton } from '@/components/LineNotificationButton';
import { todoApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const { isAuthenticated, isLoading: authLoading, user, logout } = useAuth();
  const router = useRouter();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (authLoading) return; //ログイン処理中の時なにもしない
    if (!isAuthenticated) {
      router.push('/login');
    }
    // 登録中のTodo一覧の取得と表示
    fetchTodos();
  }, [authLoading, isAuthenticated, router]);

  const fetchTodos = async () => {
    try {
      const data = await todoApi.fetchAll();
      setTodos(data);
    } catch (err) {
      console.error('Fetch error:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    // ブランクの時（前後の空白がない時）
    if (!title.trim()) {
      setError('Todoの内容を入力してください');
      return;
    }

    if (!date) {
      setError('日付を選択してください');
      return;
    }

    setLoading(true);

    try {
      await todoApi.create({ title: title.trim(), date }); //データ正規化（空文字を除外）
      setSuccessMessage('Todoを登録しました！');
      setTitle('');
      // Todo一覧の再取得
      await fetchTodos();
      // 2秒後にメッセージ消す
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="sticky top-0 bg-white border-b border-gray-200 shadow-sm z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">LineNotice</h1>
            <p className="text-sm text-gray-600">毎朝のTodo通知</p>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-2">
                {user.linePictureUrl && (
                  <img
                    src={user.linePictureUrl}
                    alt={user.lineDisplayName}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <span className="text-sm font-medium text-gray-700">{user.lineDisplayName}</span>
              </div>
            )}
            <button
              onClick={logout}
              className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1 rounded border border-gray-300 hover:border-gray-400"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        <TodoForm
          title={title}
          date={date}
          loading={loading}
          error={error}
          successMessage={successMessage}
          onTitleChange={setTitle} //関数をpropsとして渡す
          onDateChange={setDate}
          onSubmit={handleSubmit}
        />

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">登録中のTodo</h2>
          <TodoList todos={todos} />
        </div>

        <LineNotificationButton
          userId={user?.id}
          onSuccess={(message) => {
            setSuccessMessage(message);
            setTimeout(() => setSuccessMessage(''), 3000);
          }}
          onError={(message) => setError(message)}
        />
      </main>
    </div>
  );
}
