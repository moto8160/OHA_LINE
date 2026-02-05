import { Todo } from '@/types/todo';
import { todoApi } from '@/services/api';

interface TodoListProps {
  todos: Todo[];
  onDelete?: (todoId: number) => Promise<void>;
  previewStates?: Record<number, boolean>;
  onPreviewChange?: (previewStates: Record<number, boolean>) => void;
}

export function TodoList({ todos, onDelete, previewStates = {}, onPreviewChange }: TodoListProps) {
  const handleDelete = async (todoId: number) => {
    if (!window.confirm('このTodoを削除してもよろしいですか？')) {
      return;
    }

    try {
      await todoApi.delete(todoId);
      await onDelete?.(todoId);
    } catch (error) {
      alert('削除に失敗しました');
      console.error(error);
    }
  };

  const getDisplayStatus = (todo: Todo): boolean => {
    return previewStates[todo.id] !== undefined ? previewStates[todo.id] : todo.isCompleted;
  };

  const handleCheckChange = (todoId: number, checked: boolean) => {
    const newStates = { ...previewStates, [todoId]: checked };
    onPreviewChange?.(newStates);
  };
  // 日付ごとにTodoをグループ化
  const groupedTodos = todos.reduce(
    (acc, todo) => {
      const key = todo.date;
      if (!acc[key]) acc[key] = [];
      acc[key].push(todo);
      return acc;
    },
    {} as Record<string, Todo[]>,
  );

  const sortedDates = Object.keys(groupedTodos).sort().reverse();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);

    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  };

  if (sortedDates.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <div className="text-3xl mb-2">🫶</div>
        <p className="text-slate-500">Todoはまだ登録されていません</p>
        <p className="text-xs text-slate-400 mt-1">最初の1つを追加してみましょう</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sortedDates.map((dateKey) => (
        <div key={dateKey}>
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 bg-slate-100 rounded-full px-3 py-1 mb-3">
            <span>📅</span>
            <span>{formatDate(dateKey)}</span>
          </div>

          <div className="space-y-3">
            {groupedTodos[dateKey].map((todo) => {
              const displayStatus = getDisplayStatus(todo);
              const isChanging = previewStates[todo.id] !== undefined;
              return (
                <div
                  key={todo.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-3 hover:shadow-sm transition-shadow"
                >
                  <input
                    type="checkbox"
                    checked={displayStatus}
                    onChange={(e) => handleCheckChange(todo.id, e.target.checked)}
                    className="mt-1 w-5 h-5 text-emerald-600 rounded focus:ring-2 focus:ring-emerald-400 cursor-pointer"
                  />

                  <div className="flex-1">
                    <p
                      className={`text-base ${
                        displayStatus ? 'text-slate-400 line-through' : 'text-slate-900'
                      }`}
                    >
                      {todo.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(todo.createdAt).toLocaleDateString('ja-JP', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>

                  <button
                    onClick={() => handleDelete(todo.id)}
                    className="shrink-0 text-slate-500 hover:text-slate-700 text-sm font-medium"
                  >
                    削除
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
