import { Todo } from '@/types/todo';

interface TodoListProps {
  todos: Todo[];
}

export function TodoList({ todos }: TodoListProps) {
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
    // 日付文字列を正しくパースする
    // バックエンドから返される形式: "2026-01-20T00:00:00.000Z" または "2026-01-20"
    let date: Date;
    
    if (dateString.includes('T')) {
      // 既にISO形式の場合はそのまま使用
      date = new Date(dateString);
    } else {
      // YYYY-MM-DD形式の場合は時刻を追加
      date = new Date(dateString + 'T00:00:00');
    }
    
    // Invalid Dateチェック
    if (isNaN(date.getTime())) {
      console.error('Invalid date string:', dateString);
      return dateString; // フォールバック: 元の文字列を返す
    }
    
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    };
    return date.toLocaleDateString('ja-JP', options);
  };

  if (sortedDates.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-500">Todoはまだ登録されていません</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sortedDates.map((dateKey) => (
        <div key={dateKey}>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">{formatDate(dateKey)}</h3>

          <div className="space-y-2">
            {groupedTodos[dateKey].map((todo) => (
              <div
                key={todo.id}
                className="bg-white rounded-lg shadow-md p-4 flex items-start gap-3"
              >
                <input
                  type="checkbox"
                  checked={todo.isCompleted}
                  className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  readOnly
                />

                <div className="flex-1">
                  <p
                    className={`text-base ${
                      todo.isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'
                    }`}
                  >
                    {todo.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(todo.createdAt).toLocaleTimeString('ja-JP', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
