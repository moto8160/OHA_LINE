import { Injectable } from '@nestjs/common';
import * as line from '@line/bot-sdk';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class LineService {
  private readonly lineClient: line.Client;

  constructor(
    private readonly prisma: PrismaService,
  ) {
    this.lineClient = new line.Client({
      channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
    });
  }

  /**
   * LINEメッセージを送信
   * @param userId LINE User ID
   * @param message 送信するメッセージ
   */
  async sendMorningMessage(userId: string, message: string): Promise<void> {
    try {
      await this.lineClient.pushMessage(userId, {
        type: 'text',
        text: message,
      });
    } catch (error) {
      console.error('LINE送信エラー:', error);
      throw error;
    }
  }

  async handleEvent(event: any) {
    // ユーザーLINEの送信先を取得
    const lineMessagingId = event.source.userId;

    // 友達追加
    if (event.type === 'follow') {
      await this.handleFollow(event);
      return;
    }

    // メッセージ受信
    if (event.type === 'message' && event.message.type === 'text') {
      await this.handleMessage(event);
      return;
    }
  }

  private async handleFollow(event: any) {
    const lineMessagingId = event.source.userId;

    const user = await this.prisma.user.findFirst({
      where: {
        lineToken: { not: null },
        lineMessagingId: null,
      },
    });

    if (!user) return;

    const message = `連携を完了するには、以下をそのまま送ってください👇

                    LINK:${user.lineToken}`;

    await this.sendMessage(lineMessagingId, message);
  }

  async handleMessage(event: any) {
    const lineMessagingId = event.source.userId;
    const text = event.message.text.trim();

    // トークン有効チェック
    if (!text.startsWith('LINK:')) return;
    const lineToken = text.replace('LINK:', '').trim();

    const user = await this.prisma.user.findUnique({
      where: { lineToken },
    });

    if (!user) {
      const message = '無効なトークンです。再度お試しください。';
      await this.sendMessage(lineMessagingId, message);
      return;
    }

    // LINE送信先IDを設定
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lineMessagingId, lineToken: null },
    });
  }

  private async sendMessage(lineMessagingId: string, message: string) {
    await this.lineClient.pushMessage(lineMessagingId, {
      type: 'text',
      text: message,
    });
  }
}
