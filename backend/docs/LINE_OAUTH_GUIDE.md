# LINE認証フロー完全ガイド

このドキュメントは、おはLINEアプリで実装されているLINE OAuth認証の仕組みを、初心者にもわかりやすく解説します。

## 目次

1. [認証フローの全体像](#認証フローの全体像)
2. [LINE Developersでの設定](#line-developersでの設定)
3. [認証フローの詳細](#認証フローの詳細)
4. [実装されているコード](#実装されているコード)
5. [トラブルシューティング](#トラブルシューティング)

---

## 認証フローの全体像

### 登場人物

- **ユーザー（あなた）**: アプリを使う人
- **フロントエンド（Next.js）**: ブラウザで見る画面
- **バックエンド（NestJS）**: サーバー側の処理
- **LINE**: 認証を提供するサービス

### フロー図

```
┌──────────┐                    ┌──────────┐                    ┌──────────┐
│          │                    │          │                    │          │
│ ユーザー  │                    │  Next.js │                    │  NestJS  │
│          │                    │ (フロント)│                    │ (バック) │
└────┬─────┘                    └────┬─────┘                    └────┬─────┘
     │                               │                               │
     │ 1. ログインボタンをクリック    │                               │
     ├──────────────────────────────>│                               │
     │                               │                               │
    │                               │ 2. /auth/line にアクセス      │
     │                               ├──────────────────────────────>│
     │                               │                               │
     │                               │                               │
     │                          3. LINEログインページへリダイレクト │
     │<──────────────────────────────┴───────────────────────────────┤
     │                                                               │
     │                                                               │
┌────┴─────┐                                                        │
│          │                                                        │
│   LINE   │  4. LINEでログイン（メールアドレス/パスワード入力）  │
│          │                                                        │
└────┬─────┘                                                        │
     │                                                               │
     │ 5. 認証成功（認証コード発行）                                 │
     │                                                               │
    │ 6. /auth/line/callback にリダイレクト                        │
     ├──────────────────────────────────────────────────────────────>│
     │                                                               │
     │                                  7. LINEからユーザー情報取得  │
     │                                  8. DBにユーザー登録/更新     │
     │                                  9. JWTトークン発行           │
     │                                                               │
     │ 10. フロントエンドへリダイレクト（トークン付き）             │
     │<──────────────────────────────────────────────────────────────┤
     │                               │                               │
    │                               │ 11. トークンを保存            │
    │                               │ (Cookie)                      │
     │                               │                               │
     │ 12. ログイン完了！             │                               │
     │<──────────────────────────────┤                               │
     │                               │                               │
```

---

## LINE Developersでの設定

### 1. LINE Developersコンソールにアクセス

**URL**: https://developers.line.biz/console/

### 2. プロバイダーを作成

1. 「作成」ボタンをクリック
2. プロバイダー名を入力（例：`おはLINE`）

### 3. チャネルを作成

1. 「LINEログイン」を選択
2. 以下の情報を入力：

| 項目         | 入力内容         |
| ------------ | ---------------- |
| チャネル名   | `おはLINE`       |
| チャネル説明 | `Todo管理アプリ` |
| アプリタイプ | `ウェブアプリ`   |

### 4. Channel IDとChannel Secretを取得

**Basic settings**タブで以下を確認：

- **Channel ID**: 例）`2006123456`
- **Channel secret**: 例）`abcd1234efgh5678...`

### 5. Callback URLを設定

**LINE Login**タブ → **Callback URL**

```
開発環境: http://localhost:5000/auth/line/callback
本番環境: https://yourdomain.com/auth/line/callback
```

⚠️ 必ず両方とも登録してください。

### 6. 環境変数に設定

`backend/.env`ファイルに以下を設定：

```env
# LINE Login
LINE_LOGIN_CHANNEL_ID=2006123456
LINE_LOGIN_CHANNEL_SECRET=abcd1234efgh5678...
LINE_LOGIN_CALLBACK_URL=http://localhost:5000/auth/line/callback

# JWT（ランダムな文字列を生成）
JWT_SECRET=your_super_secret_random_string_here_123456789

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

💡 **JWT_SECRETの生成方法**:

```bash
# Node.jsで生成
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 認証フローの詳細

### ステップ1: ログイン開始

**ユーザーの操作**:

- フロントエンドの「LINEでログイン」ボタンをクリック

**内部処理**:

```
フロントエンド → バックエンド（GET /auth/line）
```

**バックエンドの処理**:

1. LINE Strategy（`line.strategy.ts`）が起動
2. LINEの認証URLを生成
3. ユーザーをLINEログインページにリダイレクト

**リダイレクト先**:

```
https://access.line.me/oauth2/v2.1/authorize?
  response_type=code&
  client_id=YOUR_CHANNEL_ID&
  redirect_uri=http://localhost:5000/auth/line/callback&
  state=RANDOM_STATE&
  scope=profile+openid
```

---

### ステップ2: LINEでログイン

**ユーザーの操作**:

- LINEのログインページでメールアドレス/パスワードを入力
- 「許可する」ボタンをクリック

**LINEの処理**:

- ユーザー情報を確認
- 認証が成功したら**認証コード**を発行
- バックエンドのCallback URLにリダイレクト

---

### ステップ3: コールバック処理

**内部処理**:

```
LINE → バックエンド（GET /auth/line/callback?code=XXXXX）
```

**バックエンドの処理**:

#### 3-1. 認証コードをアクセストークンに交換

`line.strategy.ts`が自動的に以下を実行：

```typescript
// LINEのトークンエンドポイントにPOSTリクエスト
POST https://api.line.me/oauth2/v2.1/token
Body: {
  grant_type: 'authorization_code',
  code: 'XXXXX',  // LINEから受け取った認証コード
  redirect_uri: 'http://localhost:5000/auth/line/callback',
  client_id: 'YOUR_CHANNEL_ID',
  client_secret: 'YOUR_CHANNEL_SECRET'
}

// レスポンス
{
  access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  token_type: 'Bearer',
  expires_in: 3600
}
```

#### 3-2. ユーザー情報を取得

```typescript
// LINEのプロフィールAPIにGETリクエスト
GET https://api.line.me/v2/profile
Headers: {
  Authorization: 'Bearer ACCESS_TOKEN'
}

// レスポンス
{
  userId: 'U1234567890abcdef',
  displayName: '山田太郎',
  pictureUrl: 'https://profile.line-scdn.net/...'
}
```

#### 3-3. DBにユーザーを登録/更新

`auth.service.ts` の `validateLineUser()` が実行：

```typescript
// 既存ユーザーを検索
const user = await prisma.user.findUnique({
  where: { lineLoginId: 'U1234567890abcdef' },
});

if (!user) {
  // 新規登録
  await prisma.user.create({
    data: {
      lineLoginId: 'U1234567890abcdef',
      lineDisplayName: '山田太郎',
      linePictureUrl: 'https://profile.line-scdn.net/...',
      lineToken: '',
    },
  });
} else {
  // 既存ユーザーの情報を更新（名前や画像は変更される可能性があるため）
  await prisma.user.update({
    where: { id: user.id },
    data: {
      lineDisplayName: '山田太郎',
      linePictureUrl: 'https://profile.line-scdn.net/...',
    },
  });
}
```

#### 3-4. JWTトークンを生成

`auth.service.ts` の `generateToken()` が実行：

```typescript
// JWTペイロード
const payload = { sub: userId }; // sub = ユーザーID

// トークン生成
const token = jwt.sign(payload, JWT_SECRET, {
  expiresIn: '30d',
});

// 例: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImlhdCI6MTY...
```

#### 3-5. フロントエンドにリダイレクト

```typescript
// auth.controller.ts
res.redirect(`http://localhost:3000/auth/callback?token=${access_token}`);
```

---

### ステップ4: フロントエンドでトークンを保存

**フロントエンドの処理**:

```typescript
// /auth/callback ページで
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

// トークンをCookieに保存（30日）
document.cookie = `auth_token=${token}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax; Secure`;

// ホームページにリダイレクト
router.push('/');
```

---

### ステップ5: 認証済みAPIの呼び出し

**API呼び出し時**:

```typescript
// フロントエンド
const token = document.cookie
  .split(';')
  .find((cookie) => cookie.trim().startsWith('auth_token='))
  ?.split('=')[1];

fetch('http://localhost:5000/todos', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

**バックエンドの処理**:

1. `JwtAuthGuard`がトークンを検証
2. `jwt.strategy.ts`の`validate()`が実行
3. トークンからユーザーIDを取得
4. DBでユーザーを検索
5. `req.user`にユーザー情報をセット

```typescript
// コントローラー内で
@UseGuards(JwtAuthGuard)
@Get('todos')
async getTodos(@CurrentUser() user: User) {
  // user = ログイン中のユーザー情報
  return this.todoService.findAll(user.id);
}
```

---

## 実装されているコード

### 1. LINE Strategy（`line.strategy.ts`）

**役割**: LINE OAuthの認証処理を管理

```typescript
@Injectable()
export class LineStrategy extends PassportStrategy(Strategy, 'line') {
  constructor() {
    super({
      authorizationURL: 'https://access.line.me/oauth2/v2.1/authorize',
      tokenURL: 'https://api.line.me/oauth2/v2.1/token',
      clientID: process.env.LINE_LOGIN_CHANNEL_ID,
      clientSecret: process.env.LINE_LOGIN_CHANNEL_SECRET,
      callbackURL: process.env.LINE_LOGIN_CALLBACK_URL,
      scope: ['profile', 'openid'],
    });
  }

  async validate(accessToken: string) {
    // アクセストークンでLINEのプロフィール取得
    // ユーザーをDBに登録/更新
    // ユーザー情報を返す
  }
}
```

**スコープの説明**:

- `profile`: ユーザー名、プロフィール画像を取得
- `openid`: より安全な認証（推奨）

---

### 2. JWT Strategy（`jwt.strategy.ts`）

**役割**: JWTトークンを検証し、ユーザー情報を取得

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    // payload.sub = ユーザーID
    // DBからユーザー情報を取得
    // ユーザー情報を返す（req.userにセットされる）
  }
}
```

---

### 3. Auth Controller（`auth.controller.ts`）

**エンドポイント一覧**:

| メソッド | パス                  | 説明                     |
| -------- | --------------------- | ------------------------ |
| GET      | `/auth/line`          | LINE認証を開始           |
| GET      | `/auth/line/callback` | LINE認証のコールバック   |
| GET      | `/auth/me`            | 現在のユーザー情報を取得 |

---

### 4. Guards（ガード）

#### LineAuthGuard

```typescript
@Injectable()
export class LineAuthGuard extends AuthGuard('line') {}
```

**使い方**:

```typescript
@Get('line')
@UseGuards(LineAuthGuard)
async lineLogin() {}
```

#### JwtAuthGuard

```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

**使い方**:

```typescript
@Get('todos')
@UseGuards(JwtAuthGuard)  // ← このAPIは認証が必要
async getTodos(@CurrentUser() user: User) {}
```

---

### 5. CurrentUser Decorator

**役割**: ログイン中のユーザー情報を簡単に取得

```typescript
@Get('todos')
@UseGuards(JwtAuthGuard)
async getTodos(@CurrentUser() user: User) {
  // user.id, user.name, user.lineLoginId が使える
}
```

---

## トラブルシューティング

### 1. "Client authentication failed"

**原因**: Channel IDまたはChannel Secretが間違っている

**対処法**:

1. LINE Developersで正しい値を確認
2. `.env`ファイルを確認
3. サーバーを再起動

---

### 2. "Redirect URI mismatch"

**原因**: Callback URLが登録されていない、またはスペルミス

**対処法**:

1. LINE Developersの「LINE Login」タブでCallback URLを確認
2. 完全一致が必要（`http://`と`https://`も区別される）
3. `.env`の`LINE_LOGIN_CALLBACK_URL`を確認

**正しい例**:

```
✅ http://localhost:5000/auth/line/callback
❌ http://localhost:5000/auth/line/callback/  (末尾のスラッシュ)
❌ https://localhost:5000/auth/line/callback  (httpsとhttp)
```

---

### 3. "Token verification failed"

**原因**: JWTトークンが無効または期限切れ

**対処法**:

1. 再度ログインしてトークンを取得
2. `JWT_SECRET`が正しいか確認
3. トークンの有効期限を確認（デフォルト30日）

---

### 4. ユーザーがDBに登録されない

**原因**: Prismaのマイグレーションが実行されていない

**対処法**:

```bash
cd backend
npx prisma migrate dev
```

---

### 5. CORSエラー

**原因**: フロントエンドとバックエンドが異なるポートで動作

**対処法**:
`main.ts`にCORS設定を追加（既に設定されているか確認）:

```typescript
app.enableCors({
  origin: 'http://localhost:3000',
  credentials: true,
});
```

---

## まとめ

### 認証フローの要点

1. **ログイン開始**: ユーザーがボタンをクリック
2. **LINE認証**: LINEのページでログイン
3. **コールバック**: バックエンドでユーザー情報を取得・登録
4. **トークン発行**: JWTトークンを生成
5. **トークン保存**: フロントエンドでトークンを保存
6. **API呼び出し**: トークンを使って認証済みAPIにアクセス

### セキュリティのポイント

- ✅ JWT_SECRETは強力なランダム文字列を使用
- ✅ `.env`ファイルは`.gitignore`に追加（コミットしない）
- ✅ 本番環境ではHTTPSを使用
- ✅ トークンの有効期限を設定（長すぎないように）

### 次のステップ

1. LINE Developersでチャネルを作成
2. 環境変数を設定
3. フロントエンドのログインページを実装
4. トークン保存とAPI呼び出しを実装
5. 既存のAPIに`JwtAuthGuard`を追加

---

**参考リンク**:

- [LINE Login公式ドキュメント](https://developers.line.biz/ja/docs/line-login/)
- [Passport.js公式サイト](http://www.passportjs.org/)
- [NestJS認証ガイド](https://docs.nestjs.com/security/authentication)
