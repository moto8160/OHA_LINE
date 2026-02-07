const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

// Cookieからトークンを取得
function getAuthToken(): string | null {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie.split(';');
  const authCookie = cookies.find((cookie) => cookie.trim().startsWith('auth_token='));
  return authCookie ? authCookie.split('=')[1] : null;
}

// 認証ヘッダーを含むヘッダーを生成
function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// レスポンスを安全にJSONパースする
async function parseResponse(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    console.error('Failed to parse JSON:', text);
    throw new Error('Invalid JSON response from server');
  }
}

export interface CreateTodoDto {
  title: string;
  date: string;
}

export const todoApi = {
  /**
   * 全てのTodoを取得
   */
  async fetchAll() {
    const response = await fetch(`${API_BASE}/todos`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch todos');
    return parseResponse(response);
  },

  /**
   * 新しいTodoを作成
   */
  async create(dto: CreateTodoDto) {
    const response = await fetch(`${API_BASE}/todos`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(dto),
    });
    if (!response.ok) throw new Error('Failed to create todo');
    return parseResponse(response);
  },

  /**
   * Todoを削除
   */
  async delete(todoId: number) {
    const response = await fetch(`${API_BASE}/todos/${todoId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete todo');
    return parseResponse(response);
  },

  /**
   * 完了済みTodoを一括削除
   */
  async deleteCompleted() {
    const response = await fetch(`${API_BASE}/todos/completed`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete completed todos');
    return parseResponse(response);
  },

  /**
   * Todoの完了状態を更新
   */
  async updateStatus(todoId: number, isCompleted: boolean) {
    const response = await fetch(`${API_BASE}/todos/${todoId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ isCompleted }),
    });
    if (!response.ok) throw new Error('Failed to update todo status');
    return parseResponse(response);
  },
};

export const notificationApi = {
  /**
   * 指定ユーザーに本日のTodoをLINE送信
   */
  async sendTodayTodos() {
    const response = await fetch(`${API_BASE}/notifications/send`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to send notification');
    return parseResponse(response);
  },
};

export const profileApi = {
  /**
   * LINE通知の時刻を更新
   */
  async updateNotificationTime(notificationTime: string) {
    const response = await fetch(`${API_BASE}/auth/notification-time`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ notificationTime }),
    });
    if (!response.ok) throw new Error('Failed to update notification time');
    return parseResponse(response);
  },
};

export const linkApi = {
  /**
   * アカウント連携トークンを生成
   */
  async generateLinkToken() {
    const response = await fetch(`${API_BASE}/link/generate`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to generate link token');
    return parseResponse(response);
  },
};
