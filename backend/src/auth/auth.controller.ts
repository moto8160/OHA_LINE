import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { LineAuthGuard } from './guards/line-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * LINE認証を開始
   * GET /api/auth/line
   */
  @Get('line')
  @UseGuards(LineAuthGuard)
  async lineLogin() {
    // LineAuthGuardがリダイレクトを処理
  }

  /**
   * LINE認証のコールバック
   * GET /api/auth/line/callback
   */
  @Get('line/callback')
  @UseGuards(LineAuthGuard)
  async lineCallback(@Req() req: any, @Res() res: Response) {
    // LINE認証成功後、ユーザー情報がreq.userに格納されている
    const user = req.user;

    // JWTトークンを生成
    const { access_token } = await this.authService.generateToken(user.id);

    // フロントエンドにリダイレクトし、トークンをクエリパラメータで渡す
    // const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    // res.redirect(`${frontendUrl}/auth/callback?token=${access_token}`);
    console.log(access_token);
  }

  /**
   * 現在のユーザー情報を取得（テスト用）
   * GET /api/auth/me
   */
  @Get('me')
  async getProfile(@Req() req: any) {
    // このエンドポイントは後でJWT Guardで保護する
    return req.user;
  }
}
