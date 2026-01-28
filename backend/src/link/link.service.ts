import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class LinkService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * アカウント連携用のlinkTokenを生成
   */
  async generateLinkToken(userId: number) {
    // ランダムなトークンを生成
    const linkToken = randomBytes(32).toString('hex');

    // 有効期限を10分後に設定
    const linkTokenExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // DBに保存
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        linkToken,
        linkTokenExpiresAt,
      },
    });

    // 連携URL（LINEのAccount Link仕様に準拠）
    // バックエンドのエンドポイントを指すように修正
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const linkUrl = `${baseUrl}/link/verify/${linkToken}`;

    return {
      linkToken,
      linkUrl,
      expiresAt: linkTokenExpiresAt,
    };
  }

  /**
   * linkTokenの検証
   */
  async verifyLinkToken(linkToken: string): Promise<boolean> {
    const user = await this.prisma.user.findFirst({
      where: {
        linkToken,
        linkTokenExpiresAt: {
          gte: new Date(), // 有効期限内
        },
      },
    });

    return !!user;
  }

  /**
   * linkTokenでユーザーを取得
   */
  async getUserByLinkToken(linkToken: string) {
    return this.prisma.user.findFirst({
      where: {
        linkToken,
        linkTokenExpiresAt: {
          gte: new Date(),
        },
      },
    });
  }

  /**
   * アカウント連携完了後、linkTokenをクリア
   */
  async completeLinking(userId: number, lineMessagingId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        lineMessagingId,
        linkToken: null,
        linkTokenExpiresAt: null,
      },
    });
  }
}
