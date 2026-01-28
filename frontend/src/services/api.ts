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
    return response.json();
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
    return response.json();
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
    return response.json();
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
    return response.json();
  },
};
