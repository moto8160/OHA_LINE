import {
  Body,
  Controller,
  Get,
  Patch,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { LineAuthGuard } from './guards/line-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { UpdateNotificationTimeDto } from './dto/update-notification-time.dto';

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
    res.redirect(
      `${process.env.FRONTEND_URL}/auth/callback?token=${access_token}`,
    );
  }

  /**
   * 現在のユーザー情報を取得
   * GET /api/auth/me
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: any) {
    // @CurrentUserで取得したユーザーオブジェクトをそのまま返す
    return user;
  }

  /**
   * LINE通知の時刻を更新
   * PATCH /api/auth/notification-time
   */
  @Patch('notification-time')
  @UseGuards(JwtAuthGuard)
  async updateNotificationTime(
    @CurrentUser() user: any,
    @Body() dto: UpdateNotificationTimeDto,
  ) {
    const updatedUser = await this.authService.updateNotificationTime(
      user.id,
      dto.notificationTime,
    );

    return {
      success: true,
      notificationTime: updatedUser.notificationTime,
    };
  }
}
