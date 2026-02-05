'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Todo } from '@/types/todo';
import { TodoForm } from '@/components/TodoForm';
import { TodoList } from '@/components/TodoList';
import { LineNotificationButton } from '@/components/LineNotificationButton';
import { AccountLinkButton } from '@/components/AccountLinkButton';
import { NotificationTimeSettings } from '@/components/NotificationTimeSettings';
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
  const [previewStates, setPreviewStates] = useState<Record<number, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);

  const incompleteTodos = todos.filter((todo) => !todo.isCompleted);
  const completedTodos = todos.filter((todo) => todo.isCompleted);
  const [showIncomplete, setShowIncomplete] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);

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

  // Todo追加フォーム処理
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

  const handleSaveChanges = async () => {
    const changedIds = Object.keys(previewStates).map(Number);
    if (changedIds.length === 0) return;

    setIsSaving(true);
    try {
      for (const todoId of changedIds) {
        await todoApi.updateStatus(todoId, previewStates[todoId]);
      }
      setSuccessMessage('完了状態を更新しました！');
      setPreviewStates({});
      await fetchTodos();
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-sky-50 via-white to-emerald-50 pb-20">
      {/* ヘッダー */}
      <header className="sticky top-0 z-10 backdrop-blur bg-white/80 border-b border-white/60 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-1.5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Image
                src="/mascot.png"
                alt="おはLINE マスコット"
                width={40}
                height={40}
                className="w-10 h-10"
                unoptimized
                loader={({ src }) => src}
              />
              <div>
                <h1 className="text-lg font-bold text-slate-900">おはLINE</h1>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user && (
              <div className="flex items-center gap-2 bg-white/90 border border-slate-200 rounded-full px-3 py-1">
                {user.linePictureUrl && (
                  <Image
                    src={user.linePictureUrl}
                    alt={user.lineDisplayName}
                    width={28}
                    height={28}
                    className="w-7 h-7 rounded-full"
                    unoptimized
                    loader={({ src }) => src}
                  />
                )}
                <span className="text-xs font-medium text-slate-700">{user.lineDisplayName}</span>
              </div>
            )}
            <button
              onClick={logout}
              className="text-xs text-slate-600 hover:text-slate-900 px-2.5 py-1 rounded-full border border-slate-300 hover:border-slate-400 bg-white"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        <div className="space-y-6">
          <section className="space-y-6">
            {/* Todo登録フォーム */}
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

            {/* Todo一覧 */}
            <div className="bg-white/90 border border-slate-200 rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-slate-900">未完了のTodo</h2>
                  <button
                    onClick={() => setShowIncomplete(!showIncomplete)}
                    className="text-sm text-slate-500 hover:text-slate-700 px-2 py-1 rounded hover:bg-slate-100"
                  >
                    {showIncomplete ? '非表示' : '表示'}
                  </button>
                </div>
                <span className="text-xs text-slate-500">{incompleteTodos.length} 件</span>
              </div>
              {showIncomplete && (
                <>
                  <TodoList
                    todos={incompleteTodos}
                    onDelete={async () => {
                      await fetchTodos();
                    }}
                    previewStates={previewStates}
                    onPreviewChange={setPreviewStates}
                  />
                  {Object.keys(previewStates).length > 0 && (
                    <button
                      onClick={handleSaveChanges}
                      disabled={isSaving}
                      className="mt-4 w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-semibold rounded-lg transition-colors"
                    >
                      {isSaving ? '保存中...' : '✓ 完了状態を更新'}
                    </button>
                  )}
                </>
              )}
            </div>

            <div className="bg-white/90 border border-slate-200 rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-slate-900">完了済みのTodo</h2>
                  <button
                    onClick={() => setShowCompleted(!showCompleted)}
                    className="text-sm text-slate-500 hover:text-slate-700 px-2 py-1 rounded hover:bg-slate-100"
                  >
                    {showCompleted ? '非表示' : '表示'}
                  </button>
                </div>
                <span className="text-xs text-slate-500">{completedTodos.length} 件</span>
              </div>
              {showCompleted && (
                <>
                  <TodoList
                    todos={completedTodos}
                    onDelete={async () => {
                      await fetchTodos();
                    }}
                    previewStates={previewStates}
                    onPreviewChange={setPreviewStates}
                  />
                  {Object.keys(previewStates).length > 0 && (
                    <button
                      onClick={handleSaveChanges}
                      disabled={isSaving}
                      className="mt-4 w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-semibold rounded-lg transition-colors"
                    >
                      {isSaving ? '保存中...' : '✓ 完了状態を更新'}
                    </button>
                  )}
                </>
              )}
            </div>
          </section>

          <aside className="space-y-6">
            {/* LINE通知時間設定フォーム */}
            <NotificationTimeSettings
              initialTime={user?.notificationTime}
              onSuccess={(message) => {
                setSuccessMessage(message);
                setTimeout(() => setSuccessMessage(''), 3000);
              }}
              onError={(message) => setError(message)}
            />

            {/* LINE友達連携 */}
            <div className="bg-white/90 border border-slate-200 rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">LINE連携</h2>
              <AccountLinkButton isLinked={!!user?.lineMessagingId} lineToken={user?.lineToken} />
            </div>

            {/* LINE通知テスト送信 */}
            <div className="bg-white/90 border border-slate-200 rounded-2xl shadow-sm p-6">
              <LineNotificationButton
                userId={user?.id}
                isLinked={!!user?.lineMessagingId}
                onSuccess={(message) => {
                  setSuccessMessage(message);
                  setTimeout(() => setSuccessMessage(''), 3000);
                }}
                onError={(message) => setError(message)}
              />
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
