# NestJS認証システム深掘りガイド

## 概要

LineNoticeバックエンドでは、Passport.jsとNestJsの認証機能を組み合わせて、以下の認証フローを実装しています：

1. **LINE OAuth認証** - LINE Loginで本人確認
2. **JWT トークン発行** - 認証情報をトークン化
3. **JWT検証** - APIアクセス時にトークンを確認

このドキュメントでは、特に「自作デコレーター」と「認証ガード」について詳しく解説します。

---

## 目次

1. [NestJsの認証アーキテクチャ](#nestjsの認証アーキテクチャ)
2. [自作デコレーター @CurrentUser](#自作デコレーター-currentuser)
3. [認証ガード（Guard）](#認証ガード)
4. [JWT Strategy](#jwt-strategy)
5. [実行フロー](#実行フロー)
6. [実装例](#実装例)

---

## NestJsの認証アーキテクチャ

NestJsで認証を実装するには、以下の3つの要素が必要です：

### 1. Strategy（戦略）

- **役割**: JWTトークンを検証し、ユーザー情報を取得する
- **例**: `JwtStrategy`、`LineStrategy`
- **処理**: リクエストからトークンを抽出 → 検証 → ユーザーオブジェクトを返す

### 2. Guard（ガード）

- **役割**: リクエストがコントローラーに到達する前にStrategyを実行
- **例**: `JwtAuthGuard`、`LineAuthGuard`
- **処理**: Strategyを実行 → 認証失敗時は403エラー

### 3. Decorator（デコレーター）

- **役割**: コントローラーメソッドから認証済みユーザー情報にアクセス
- **例**: `@CurrentUser()`、`@UseGuards()`
- **処理**: `request.user`からユーザー情報を取得

---

## 自作デコレーター @CurrentUser

### ファイル: `src/auth/decorators/current-user.decorator.ts`

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * 現在のユーザー情報を取得するデコレーター
 * @CurrentUser() で使用可能
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

### 何をしているか

このデコレーターは、NestJsの **Parameter Decorator（パラメータデコレーター）** です。

**デコレーターの基本概念:**

デコレーターは、クラス、メソッド、プロパティ、パラメータに機能を追加する仕組みです。

```typescript
// 従来のやり方（悪い例）
async getProfile(req: Request) {
  const user = req.user;  // 毎回 req.user を書かないといけない
  return user;
}

// デコレーターを使った方法（良い例）
async getProfile(@CurrentUser() user) {  // デコレーターが自動的に user を取得
  return user;
}
```

### コンポーネント解説

#### 1. `createParamDecorator`

```typescript
export const CurrentUser = createParamDecorator(...)
```

- NestJsが提供する関数
- パラメータデコレーターを作成するための関数
- 第1引数として、処理内容をコールバック関数で受け取る

#### 2. `(data: unknown, ctx: ExecutionContext) => { ... }`

```typescript
(data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
};
```

**パラメータの意味:**

| パラメータ | 型                 | 説明                                               |
| ---------- | ------------------ | -------------------------------------------------- |
| `data`     | `unknown`          | デコレーターに渡されたオプション値（使っていない） |
| `ctx`      | `ExecutionContext` | 実行コンテキスト（リクエスト情報など）             |

**処理の流れ:**

1. `ctx.switchToHttp()` - HTTPコンテキストに切り替え
2. `.getRequest()` - HTTPリクエストオブジェクトを取得
3. `request.user` - リクエストに付与されたユーザー情報を返す

### 使用方法

```typescript
@Controller('auth')
export class AuthController {
  @Get('me')
  @UseGuards(JwtAuthGuard) // JwtAuthGuardで保護
  async getProfile(@CurrentUser() user: any) {
    // user には、JwtStrategyが設定したユーザーオブジェクトが自動的に渡される
    return user;
  }
}
```

### データの流れ図

```
HTTP Request
    ↓
JwtAuthGuard (リクエストをインターセプト)
    ↓
JwtStrategy.validate() (トークン検証)
    ↓
request.user = ユーザーオブジェクト (Strategyが設定)
    ↓
getProfile(@CurrentUser() user) (デコレーターが request.user を取得)
    ↓
user パラメータにユーザーオブジェクトが渡される
```

---

## 認証ガード

### ファイル: `src/auth/guards/jwt-auth.guard.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

### 何をしているか

**Guard（ガード）** は、リクエストがコントローラーに到達する前に実行される「門番」の役割をします。

### ガードの実行フロー

```
リクエスト到達
    ↓
JwtAuthGuard が作動
    ↓
JwtStrategy が JWTトークンを検証
    ↓
【成功】request.user にユーザーオブジェクトを設定 → コントローラーに進む
【失敗】UnauthorizedException (401エラー) を返す
```

### 使用方法

```typescript
@Get('me')
@UseGuards(JwtAuthGuard)  // このメソッドは JwtAuthGuard で保護される
async getProfile(@CurrentUser() user: any) {
  return user;
}
```

**`@UseGuards(JwtAuthGuard)` の効果:**

- JwtAuthGuardなしの場合：

  ```typescript
  async getProfile(req: Request) {
    // JWTトークンの確認をしていない
    // 誰でもアクセス可能（危険！）
    return req.user;  // undefined になる可能性
  }
  ```

- JwtAuthGuardを使った場合：
  ```typescript
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: any) {
    // JwtAuthGuard が自動的にトークンを検証
    // 有効なトークンがない場合は 401エラーで拒否
    return user;  // 必ずユーザーオブジェクトが存在
  }
  ```

---

## JWT Strategy

### ファイル: `src/auth/strategies/jwt.strategy.ts`

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET!,
    });
  }

  /**
   * JWTトークンのペイロードを検証し、ユーザー情報を返す
   */
  async validate(payload: any) {
    const user = await this.authService.validateToken(payload.sub);

    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }
}
```

### 何をしているか

JwtStrategy は、**Passport.js** の JWT検証戦略を実装しています。

### constructor の設定

```typescript
super({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  ignoreExpiration: false,
  secretOrKey: process.env.JWT_SECRET!,
});
```

| 設定項目           | 説明                                              |
| ------------------ | ------------------------------------------------- |
| `jwtFromRequest`   | JWTトークンをリクエストから**どこから**取得するか |
| `ignoreExpiration` | トークンの有効期限チェックの有無                  |
| `secretOrKey`      | トークン署名の検証に使う秘密鍵                    |

**jwtFromRequest の詳細:**

```typescript
ExtractJwt.fromAuthHeaderAsBearerToken();
```

これは、リクエストヘッダーから JWT を抽出する仕組みです：

```
リクエストヘッダー:
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
                 ↓ ここから抽出
トークン部分: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### validate メソッド

```typescript
async validate(payload: any) {
  const user = await this.authService.validateToken(payload.sub);

  if (!user) {
    throw new UnauthorizedException();
  }

  return user;
}
```

**処理フロー:**

1. `payload` - デコードされたJWTペイロード（署名済み）

   ```javascript
   {
     sub: 1,           // ユーザーID
     iat: 1234567890,  // 発行日時
     exp: 1234571490   // 有効期限
   }
   ```

2. `payload.sub` - ユーザーID を抽出

3. `validateToken(payload.sub)` - データベースでユーザーを検索

4. ユーザーが見つかった場合、そのユーザーオブジェクトを返す

5. ユーザーが見つからない場合、401エラーを返す

6. 返されたユーザーオブジェクトは `request.user` に自動的に設定される

---

## 実行フロー

### ログイン後、API呼び出しの全体フロー

```
1. フロントエンドがAPI呼び出し
   POST /api/auth/me
   Headers: {
     Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   }
    ↓
2. NestJsが@UseGuards(JwtAuthGuard)を見つける
    ↓
3. JwtAuthGuardが実行される
    ↓
4. JwtStrategyが実行される
    ├─ Authorization ヘッダーからトークンを抽出
    ├─ JWT_SECRETで署名を検証
    ├─ トークンのペイロード (sub=1) をデコード
    └─ validate(payload) を呼び出す
    ↓
5. JwtStrategy.validate() が実行される
    ├─ validateToken(1) を呼び出す
    ├─ データベースでユーザーID=1を検索
    ├─ ユーザーオブジェクトを取得
    └─ ユーザーオブジェクトを返す
    ↓
6. request.user にユーザーオブジェクトが設定される
    ↓
7. コントローラーメソッドが実行される
   async getProfile(@CurrentUser() user) {
     // @CurrentUser() デコレーターが request.user を取得
     // user = { id: 1, lineUserId: "U123...", lineDisplayName: "山田太郎", ... }
   }
    ↓
8. ユーザー情報をレスポンスとして返す
    ↓
9. フロントエンドがユーザー情報を受け取る
```

---

## 実装例

### 例1: 認証が必要なエンドポイント

```typescript
@Controller('users')
export class UserController {
  @Get('profile')
  @UseGuards(JwtAuthGuard) // JWT認証が必須
  async getProfile(@CurrentUser() user: any) {
    // user は必ず存在する（JwtAuthGuardで検証済み）
    return {
      id: user.id,
      name: user.lineDisplayName,
      picture: user.linePictureUrl,
    };
  }
}
```

### 例2: 認証が不要なエンドポイント

```typescript
@Controller('auth')
export class AuthController {
  @Get('login')
  // @UseGuards がないので、認証なしでアクセス可能
  async login() {
    return { message: 'ログインページへリダイレクト' };
  }
}
```

### 例3: より詳細なユーザー情報の取得

```typescript
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: any) {
    // JwtAuthGuard は request.user を設定
    // @CurrentUser() はそれを取得
    const detailedUser = await this.userService.findById(user.id);
    return detailedUser;
  }
}
```

---

## トラブルシューティング

### Q: `@CurrentUser() user` が `undefined` になる

**原因:** JwtAuthGuardが実行されていない

**解決方法:**

```typescript
// ❌ 間違い
@Get('profile')
async getProfile(@CurrentUser() user: any) {
  // @UseGuards がないので request.user が設定されない
  return user;  // undefined
}

// ✅ 正しい
@Get('profile')
@UseGuards(JwtAuthGuard)
async getProfile(@CurrentUser() user: any) {
  return user;  // ユーザーオブジェクト
}
```

### Q: "Cannot find module" エラーが出る

**原因:** デコレーターがimportされていない

**解決方法:**

```typescript
// デコレーターをimport
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
```

### Q: トークンが有効でも401エラーが返される

**原因:** JWTトークンのペイロードにユーザーが見つからない

**解決方法:**

- データベースにユーザーが存在するか確認
- `validateToken()` の実装を確認
- ログで詳細を確認

---

## まとめ

### Guard（ガード）

- 何をする？ JWTトークンの検証とユーザー情報の取得
- いつ実行？ コントローラーメソッドの実行前
- どうやって使う？ `@UseGuards(JwtAuthGuard)` デコレーター

### Decorator（デコレーター）

- 何をする？ `request.user` をメソッドパラメータに取得
- いつ実行？ コントローラーメソッド実行時
- どうやって使う？ `@CurrentUser()` メソッドパラメータ

### Strategy（戦略）

- 何をする？ JWTトークンの検証とユーザー情報の検索
- いつ実行？ Guard が呼び出すとき
- どうやって使う？ `validate()` メソッドで実装

### 関係図

```
HTTP Request
    ↓
@UseGuards(JwtAuthGuard)  ← これが実行される
    ↓
JwtStrategy.validate()    ← ここで検証される
    ↓
request.user = ユーザーオブジェクト ← ここで設定される
    ↓
@CurrentUser() user       ← ここで取得される
    ↓
コントローラーメソッド実行
```
