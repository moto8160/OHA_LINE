import { Todo } from '@/types/todo';

interface TodoListProps {
  todos: Todo[];
}

export function TodoList({ todos }: TodoListProps) {
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
