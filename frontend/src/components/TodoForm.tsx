interface TodoFormProps {
  title: string;
  date: string;
  loading: boolean;
  error: string;
  successMessage: string;
  onTitleChange: (value: string) => void; //関数の引数と戻り値の型
  onDateChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function TodoForm({
  title,
  date,
  loading,
  error,
  successMessage,
  onTitleChange,
  onDateChange,
  onSubmit,
}: TodoFormProps) {
  return (
    <div className="bg-white/90 border border-slate-200 rounded-2xl shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
          ✍️
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">新しいTodoを追加</h2>
          <p className="text-xs text-slate-500">やることを1つずつ整理しましょう</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl">
          <p className="text-sm text-rose-700">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
          <p className="text-sm text-emerald-700">{successMessage}</p>
        </div>
      )}

      {/* 親の関数を呼び出している */}
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-2">
            Todoの内容
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="例：買い物、仕事など"
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent bg-white"
          />
        </div>

        <div>
          <label htmlFor="date" className="block text-sm font-medium text-slate-700 mb-2">
            日付
          </label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent bg-white text-slate-900"
            style={{ colorScheme: 'light' }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-semibold py-3.5 rounded-xl transition-colors shadow-sm"
        >
          {loading ? '登録中...' : 'Todoを追加'}
        </button>
      </form>
    </div>
  );
}
