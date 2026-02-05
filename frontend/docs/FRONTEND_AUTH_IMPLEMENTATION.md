# フロントエンド認証実装ガイド

## 概要

おはLINEフロントエンドは、React Context APIを使用した認証システムを実装しています。LINE Login OAuth 2.0で取得したJWTトークンをCookieに保存し、アプリケーション全体で認証状態を管理します。

## 認証アーキテクチャ

### 主要コンポーネント

1. **AuthContext** - グローバル認証状態の管理
2. **useAuth Hook** - 認証機能へのアクセス
3. **AuthProvider** - アプリケーション全体への認証状態の提供
4. **ログインページ** - LINE認証の開始
5. **コールバックページ** - OAuth後のトークン処理
6. **認証ガード** - 保護されたページへのアクセス制御

---

## React Context APIとは

React Context APIは、コンポーネントツリー全体でデータを共有するための仕組みです。

### なぜContextを使うのか

通常、Reactではデータは親から子へpropsとして渡されます。しかし、多くのコンポーネントで同じデータが必要な場合、何階層もpropsを受け渡す「props drilling」が発生します。

```tsx
// props drillingの例（悪い例）
<App user={user}>
  <Layout user={user}>
    <Header user={user}>
      <UserMenu user={user} /> // userを使いたいのはここだけなのに...
    </Header>
  </Layout>
</App>
```

Context APIを使うと、中間コンポーネントを経由せずに直接データにアクセスできます。

```tsx
// Context APIの例（良い例）
<AuthProvider>
  {' '}
  // 一度だけProviderでラップ
  <Layout>
    <Header>
      <UserMenu /> // useAuth()で直接アクセス可能
    </Header>
  </Layout>
</AuthProvider>
```

### Context APIの3つの要素

1. **Context作成** - `createContext()` でContextを作成
2. **Provider** - データを提供するコンポーネント
3. **Consumer** - データを使用するコンポーネント（useContextフック）

---

## AuthContext実装の詳細

### ファイル: `src/contexts/AuthContext.tsx`

#### 1. Context型定義

```tsx
interface User {
  id: number;
  lineUserId: string;
  lineDisplayName: string;
  linePictureUrl?: string;
}

interface AuthContextType {
  isAuthenticated: boolean; // 認証済みかどうか
  isLoading: boolean; // 初期化中かどうか
  user: User | null; // ログイン中のユーザー情報
  login: (token: string) => void; // ログイン処理
  logout: () => void; // ログアウト処理
  getToken: () => string | null; // トークン取得
  fetchUser: () => Promise<void>; // ユーザー情報取得
}
```

この型は、Contextが提供する機能を定義しています。

#### 2. Contextの作成

```tsx
const AuthContext = createContext<AuthContextType | undefined>(undefined);
```

- `createContext()` で新しいContextを作成
- 初期値は `undefined`（Providerの外で使われた場合にエラーを検出するため）

#### 3. AuthProvider - データの提供

```tsx
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  // Cookieからトークンを取得
  const getToken = (): string | null => {
    if (typeof document === 'undefined') return null; // SSR対応

    const cookies = document.cookie.split(';');
    const authCookie = cookies.find((cookie) => cookie.trim().startsWith('auth_token='));
    return authCookie ? authCookie.split('=')[1] : null;
  };

  // ユーザー情報を取得
  const fetchUser = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // トークンが無効な場合はログアウト
        logout();
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    }
  };

  // ログイン処理
  const login = (token: string) => {
    document.cookie = `auth_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
    setIsAuthenticated(true);
  };

  // ログアウト処理
  const logout = () => {
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    setIsAuthenticated(false);
    setUser(null);
    router.push('/login');
  };

  // 初回マウント時に認証状態をチェック
  useEffect(() => {
    const token = getToken();
    setIsAuthenticated(!!token);

    if (token) {
      fetchUser();
    }

    setIsLoading(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, isLoading, user, login, logout, getToken, fetchUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}
```

**ポイント:**

- `useState` で認証状態とユーザー情報を管理
- `fetchUser()` でバックエンドの `/auth/me` エンドポイントからユーザー情報を取得
- `useEffect` でコンポーネントマウント時にCookieをチェックし、トークンがあればユーザー情報も取得
- `AuthContext.Provider` で子コンポーネントに値を提供
- `value` プロパティに提供したいデータを渡す

#### 4. useAuth - カスタムフック

```tsx
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

**これが何をしているか:**

1. `useContext(AuthContext)` で最も近いProviderの値を取得
2. Providerの外で使われた場合はエラーを投げる
3. 型安全に値を返す

**使い方:**

```tsx
// 任意のコンポーネント内で
const { isAuthenticated, user, login, logout } = useAuth();

// ユーザー情報の表示
if (user) {
  console.log(user.lineDisplayName); // LINEの表示名
  console.log(user.linePictureUrl); // LINEのプロフィール画像URL
}
```

---

## アプリケーション全体への適用

### ファイル: `src/app/layout.tsx`

```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
```

**なぜここに配置するのか:**

- `layout.tsx` はアプリ全体のルートレイアウト
- ここで `AuthProvider` をラップすることで、全ページで `useAuth()` が使える
- 1回だけProviderを配置すれば、どのページ、どのコンポーネントからでもアクセス可能

**データの流れ:**

```
AuthProvider (layout.tsx)
    ↓ (Contextで共有)
    ├─ LoginPage
    ├─ HomePage → useAuth() でアクセス
    ├─ TodoForm → useAuth() でアクセス
    └─ Header → useAuth() でアクセス
```

---

## 認証フロー

### 1. ログインフロー

#### ファイル: `src/app/login/page.tsx`

```tsx
export default function LoginPage() {
  const handleLineLogin = () => {
    // バックエンドのLINE認証エンドポイントにリダイレクト
    window.location.href = `${process.env.NEXT_PUBLIC_API_BASE}/auth/line`;
  };

  return <button onClick={handleLineLogin}>LINEでログイン</button>;
}
```

**フロー:**

1. ユーザーが「LINEでログイン」ボタンをクリック
2. バックエンドの `/auth/line` にリダイレクト
3. バックエンドがLINE認証画面にリダイレクト
4. ユーザーがLINEで認証

### 2. コールバックフロー

#### ファイル: `src/app/auth/callback/page.tsx`

```tsx
export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setError('認証に失敗しました');
      setTimeout(() => router.push('/login'), 3000);
      return;
    }

    // トークンをCookieに保存（7日間有効）
    document.cookie = `auth_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;

    // ホームページにリダイレクト
    router.push('/');
  }, [searchParams, router]);

  return <div>認証中...</div>;
}
```

**フロー:**

1. LINE認証成功後、バックエンドが `/auth/callback?token=xxx` にリダイレクト
2. URLからトークンを取得
3. Cookieにトークンを保存
   - `path=/` - 全ページで有効
   - `max-age=604800` - 7日間有効（秒単位）
   - `SameSite=Lax` - CSRF対策
4. ホームページ (`/`) にリダイレクト

### 3. 認証状態の初期化とユーザー情報取得

AuthProviderが最初にマウントされたとき:

```tsx
useEffect(() => {
  const token = getToken(); // Cookieからトークンを取得
  setIsAuthenticated(!!token); // トークンがあれば認証済み

  if (token) {
    fetchUser(); // トークンがあればユーザー情報も取得
  }

  setIsLoading(false); // 初期化完了
}, []);
```

**fetchUser関数の処理:**

1. バックエンドの `/auth/me` にGETリクエスト
2. JWTトークンを `Authorization: Bearer {token}` ヘッダーで送信
3. ユーザー情報（id, lineUserId, lineDisplayName, linePictureUrl）を受け取る
4. `setUser(userData)` で状態を更新
5. トークンが無効な場合は自動的にログアウト

### 4. ページでの認証チェックとユーザー表示

#### ファイル: `src/app/page.tsx`

```tsx
export default function Home() {
  const { isAuthenticated, isLoading: authLoading, user, logout } = useAuth();
  const router = useRouter();

  // 認証チェック
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login'); // 未認証ならログインページへ
    }
  }, [isAuthenticated, authLoading, router]);

  // ローディング中または未認証の場合は何も表示しない
  if (authLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div>
      <header>
        <h1>おはLINE</h1>

        {/* ユーザー情報の表示 */}
        <div className="user-info">
          {user && (
            <>
              {user.linePictureUrl && (
                <img
                  src={user.linePictureUrl}
                  alt={user.lineDisplayName}
                  className="profile-image"
                />
              )}
              <span>{user.lineDisplayName}</span>
            </>
          )}
          <button onClick={logout}>ログアウト</button>
        </div>
      </header>

      {/* ページコンテンツ */}
    </div>
  );
}
```

**認証ガードとユーザー表示の仕組み:**

1. `useAuth()` で認証状態とユーザー情報を取得
2. `useEffect` で認証状態を監視
3. `authLoading` が完了して `isAuthenticated` が `false` なら `/login` にリダイレクト
4. 認証済みの場合のみページコンテンツを表示
5. `user` オブジェクトからLINEのプロフィール画像と表示名を表示

---

## API呼び出しでのトークン使用

### ファイル: `src/services/api.ts`

```tsx
// Cookieからトークンを取得
const getAuthToken = (): string | null => {
  if (typeof document === 'undefined') return null;

  const cookies = document.cookie.split(';');
  const authCookie = cookies.find((cookie) => cookie.trim().startsWith('auth_token='));
  return authCookie ? authCookie.split('=')[1] : null;
};

// 認証ヘッダーを取得
const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// API呼び出しの例
export const todoApi = {
  fetchAll: async (): Promise<Todo[]> => {
    const response = await fetch(`${API_BASE}/todo`, {
      headers: getAuthHeaders(), // JWTトークンを含める
    });

    if (!response.ok) throw new Error('Failed to fetch todos');
    return response.json();
  },

  create: async (data: CreateTodoDto): Promise<Todo> => {
    const response = await fetch(`${API_BASE}/todo`, {
      method: 'POST',
      headers: getAuthHeaders(), // JWTトークンを含める
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error('Failed to create todo');
    return response.json();
  },
};
```

**トークンの流れ:**

1. Cookieから `auth_token` を取得
2. `Authorization: Bearer {token}` ヘッダーに設定
3. バックエンドがJWTトークンを検証
4. 認証済みユーザーのデータのみ返す

---

## Cookie管理の詳細

### Cookieの設定

```tsx
document.cookie = `auth_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
```

**パラメータの意味:**

- `auth_token=${token}` - Cookie名と値
- `path=/` - サイト全体で有効
- `max-age=604800` - 7日間有効（秒単位）
- `SameSite=Lax` - 同一サイトからのみ送信（CSRF対策）

### Cookieの削除

```tsx
document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
```

**仕組み:**

- 空の値を設定
- 過去の日付を `expires` に設定
- ブラウザが自動的にCookieを削除

### Cookieの取得

```tsx
const getToken = (): string | null => {
  if (typeof document === 'undefined') return null; // SSR対応

  const cookies = document.cookie.split(';'); // Cookieを分割
  const authCookie = cookies.find((cookie) => cookie.trim().startsWith('auth_token='));
  return authCookie ? authCookie.split('=')[1] : null;
};
```

**手順:**

1. `document.cookie` で全Cookieを取得（セミコロン区切りの文字列）
2. `;` で分割して配列化
3. `auth_token=` で始まるCookieを検索
4. `=` で分割して値部分のみ取得

---

## セキュリティ考慮事項

### 1. SSR対応

```tsx
if (typeof document === 'undefined') return null;
```

Next.jsはサーバーサイドでもコンポーネントをレンダリングします。`document` はブラウザでのみ存在するため、サーバーサイドでのエラーを防ぐためのチェックです。

### 2. SameSite属性

```tsx
SameSite = Lax;
```

クロスサイトリクエストフォージェリ（CSRF）攻撃を防ぐため、`SameSite` 属性を設定しています。

### 3. HTTPSのみ（本番環境）

本番環境では `Secure` フラグを追加すべきです:

```tsx
// 本番環境での推奨設定
document.cookie = `auth_token=${token}; path=/; max-age=604800; SameSite=Lax; Secure`;
```

### 4. トークンの有効期限

- Cookie: 7日間
- JWT: 24時間（バックエンドで設定）

Cookieの有効期限が長くても、JWTの有効期限が切れていればAPIアクセスは拒否されます。

---

## よくある質問

### Q1: なぜlocalStorageではなくCookieを使うのか?

**理由:**

1. **HttpOnlyフラグ**: 将来的にHttpOnlyフラグを設定すれば、JavaScriptからのアクセスを防げる（XSS対策）
2. **自動送信**: CookieはHTTPリクエストで自動的に送信される
3. **有効期限管理**: `max-age` で自動的に期限切れになる

現在の実装では `document.cookie` を使っているため、まだHttpOnlyではありませんが、バックエンドでCookieを設定するように変更すれば、より安全になります。

### Q2: useAuthフックの外でトークンにアクセスしたい場合は?

`api.ts` のように、React コンポーネントの外でもCookieから直接取得できます:

```tsx
const getAuthToken = (): string | null => {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie.split(';');
  const authCookie = cookies.find((cookie) => cookie.trim().startsWith('auth_token='));
  return authCookie ? authCookie.split('=')[1] : null;
};
```

### Q3: AuthProviderを複数配置できるか?

できますが、推奨しません。各Providerは独立した状態を持つため、同期が取れなくなります。アプリ全体で1つのProviderを使うべきです。

### Q4: 認証状態はどこに保存されるのか?

AuthProviderの `useState` フック内に保存されます。これはReactのメモリ内状態です。ページをリロードすると消えますが、`useEffect` でCookieから復元します。

### Q5: ユーザー情報はいつ取得されるのか?

1. **初回ロード時**: AuthProviderのマウント時にCookieにトークンがあれば自動的に `fetchUser()` が実行される
2. **ログイン後**: `/auth/callback` ページでトークンがCookieに保存され、ホームページに遷移すると AuthProvider が再マウントされて `fetchUser()` が実行される
3. **手動取得**: 必要に応じて `fetchUser()` を直接呼び出すことも可能

### Q6: ユーザー情報が取得できない場合は?

`fetchUser()` がエラーを返した場合（トークンが無効など）は、自動的に `logout()` が呼ばれてログイン画面にリダイレクトされます。

---

## まとめ

### React Context APIの利点

1. **グローバルな状態管理**: 深くネストされたコンポーネントでもprops drillingなしでアクセス可能
2. **型安全**: TypeScriptで型定義することで、使用時の型エラーを防げる
3. **カスタムフック**: `useAuth()` のような直感的なAPIを提供できる

### 認証フローの流れ

```
1. ログインボタンクリック
   ↓
2. バックエンド /auth/line にリダイレクト
   ↓
3. LINE認証画面
   ↓
4. バックエンド /auth/line/callback (JWTトークン生成)
   ↓
5. フロントエンド /auth/callback?token=xxx
   ↓
6. Cookieにトークン保存
   ↓
7. ホームページにリダイレクト
   ↓
8. AuthProviderがCookieをチェック → 認証済み状態に
   ↓
9. fetchUser()でバックエンドから最新のユーザー情報を取得
   ↓
10. ユーザー名とプロフィール画像を画面に表示
   ↓
11. 以降のAPI呼び出しでJWTトークンを自動的にヘッダーに含める
```

### ユーザー情報の表示

ログイン後、以下のユーザー情報が利用可能になります：

```tsx
const { user } = useAuth();

// user オブジェクトの内容:
{
  id: 1,                                    // DB上のユーザーID
  lineUserId: "U1234567890abcdef...",      // LINEのユーザーID
  lineDisplayName: "山田太郎",              // LINEの表示名
  linePictureUrl: "https://profile.line-scdn.net/..." // プロフィール画像URL（オプション）
}
```

画面での表示例：

```tsx
{
  user && (
    <div className="user-profile">
      {user.linePictureUrl && <img src={user.linePictureUrl} alt={user.lineDisplayName} />}
      <span>{user.lineDisplayName}</span>
    </div>
  );
}
```

### ファイル構成

| ファイル                         | 役割                                      |
| -------------------------------- | ----------------------------------------- |
| `src/contexts/AuthContext.tsx`   | Context定義、Provider、useAuthフック      |
| `src/app/layout.tsx`             | AuthProviderでアプリ全体をラップ          |
| `src/app/login/page.tsx`         | ログインUI、バックエンドにリダイレクト    |
| `src/app/auth/callback/page.tsx` | OAuthコールバック、トークンをCookieに保存 |
| `src/app/page.tsx`               | 認証ガードの実装例                        |
| `src/services/api.ts`            | API呼び出し時のトークン自動付与           |

この認証システムにより、安全で使いやすい認証機能が実現されています。
