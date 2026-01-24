import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-line';
import { randomBytes } from 'crypto';
import { AuthService } from '../auth.service';

// LINE Login v2ではstateが必須。セッションを使わないため、簡易なメモリストアでstateを保持する。
class MemoryStateStore {
  private states = new Set<string>();

  store(_req: any, cb: (err: any, state?: string) => void) {
    const state = randomBytes(16).toString('hex');
    this.states.add(state);
    cb(null, state);
  }

  verify(
    _req: any,
    state: string,
    cb: (err: any, ok?: boolean, state?: string) => void,
  ) {
    const exists = this.states.has(state);
    if (exists) {
      this.states.delete(state);
      return cb(null, true, state);
    }
    return cb(null, false, state);
  }
}

@Injectable()
export class LineStrategy extends PassportStrategy(Strategy, 'line') {
  constructor(private readonly authService: AuthService) {
    super({
      channelID: process.env.LINE_CHANNEL_ID,
      channelSecret: process.env.LINE_CHANNEL_SECRET,
      callbackURL: process.env.LINE_CALLBACK_URL,
      scope: ['profile', 'openid'],
      state: true,
      store: new MemoryStateStore(),
    });
  }

  /**
   * アクセストークンを使ってLINEのプロフィール情報を取得
   */
  async validate(accessToken: string): Promise<any> {
    // LINEのプロフィールAPIを呼び出し
    const response = await fetch('https://api.line.me/v2/profile', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch LINE profile');
    }

    const profile = await response.json();
    console.log(profile);

    // プロフィール情報を使ってユーザーを検証・登録
    const user = await this.authService.validateLineUser({
      id: profile.userId,
      displayName: profile.displayName,
      pictureUrl: profile.pictureUrl,
    });

    return user;
  }
}
