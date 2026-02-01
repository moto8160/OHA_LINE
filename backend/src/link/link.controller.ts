import { Controller, Post, Get, UseGuards, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { LinkService } from './link.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('link')
export class LinkController {
  constructor(private readonly linkService: LinkService) {}

  /**
   * アカウント連携トークンを生成
   * POST /link/generate
   */
  @Post('generate')
  @UseGuards(JwtAuthGuard)
  async generateLinkToken(@CurrentUser() user: any) {
    const linkInfo = await this.linkService.generateLinkToken(user.id);
    return linkInfo;
  }

  /**
   * アカウント連携の検証（LINE側から呼ばれる）
   * GET /link/verify/:linkToken
   */
  @Get('verify/:linkToken')
  async verifyLinkToken(
    @Param('linkToken') linkToken: string,
    @Res() res: Response,
  ) {
    const isValid = await this.linkService.verifyLinkToken(linkToken);
    const botUserId =
      process.env.LINE_BOT_USER_ID || 'Uc4fa7a4e99c3f69fdb51161c48313362';
    const botUrl = `https://line.me/R/ti/p/~${botUserId}`;

    if (isValid) {
      const html = `
        <!DOCTYPE html>
        <html lang="ja">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>アカウント連携</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 20px;
            }
            .container {
              background: white;
              border-radius: 12px;
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
              max-width: 400px;
              width: 100%;
              padding: 40px;
              text-align: center;
            }
            .success-icon {
              width: 60px;
              height: 60px;
              background: #4CAF50;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 20px;
              font-size: 30px;
              color: white;
            }
            h1 { color: #333; margin-bottom: 10px; font-size: 24px; }
            p { color: #666; margin-bottom: 20px; line-height: 1.6; font-size: 14px; }
            .steps {
              background: #f5f5f5;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
              text-align: left;
            }
            .steps ol { padding-left: 20px; color: #555; font-size: 13px; line-height: 1.8; }
            .steps li { margin-bottom: 8px; }
            .button {
              display: inline-block;
              background: #667eea;
              color: white;
              padding: 12px 30px;
              border-radius: 6px;
              text-decoration: none;
              font-weight: bold;
              margin-top: 20px;
              transition: background 0.3s;
            }
            .button:hover { background: #5568d3; }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #eee;
              font-size: 12px;
              color: #999;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success-icon">✓</div>
            <h1>アカウント連携準備完了</h1>
            <p>Webアプリとのアカウント連携の準備ができました。</p>
            
            <div class="steps">
              <ol>
                <li>下の「Botを友達追加」ボタンをタップ</li>
                <li>Botからのアカウント連携ボタンをタップ</li>
                <li>連携完了！</li>
              </ol>
            </div>

            <a href="${botUrl}" class="button" target="_blank">
              Botを友達追加
            </a>

            <div class="footer">
              <p>このトークンは10分間有効です</p>
            </div>
          </div>
        </body>
        </html>
      `;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    } else {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const html = `
        <!DOCTYPE html>
        <html lang="ja">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>エラー</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
              background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 20px;
            }
            .container {
              background: white;
              border-radius: 12px;
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
              max-width: 400px;
              width: 100%;
              padding: 40px;
              text-align: center;
            }
            .error-icon {
              width: 60px;
              height: 60px;
              background: #f44336;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 20px;
              font-size: 30px;
              color: white;
            }
            h1 { color: #333; margin-bottom: 10px; font-size: 24px; }
            p { color: #666; margin-bottom: 20px; line-height: 1.6; font-size: 14px; }
            .button {
              display: inline-block;
              background: #f44336;
              color: white;
              padding: 12px 30px;
              border-radius: 6px;
              text-decoration: none;
              font-weight: bold;
              margin-top: 20px;
              transition: background 0.3s;
            }
            .button:hover { background: #da190b; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="error-icon">×</div>
            <h1>連携トークン無効</h1>
            <p>このリンクは無効または有効期限が切れています。</p>
            <p style="font-size: 12px; color: #999;">
              Webアプリでログイン直してください。
            </p>
            <a href="${frontendUrl}" class="button">
              Webアプリに戻る
            </a>
          </div>
        </body>
        </html>
      `;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(400).send(html);
    }
  }
}
