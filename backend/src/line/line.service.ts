import { Injectable } from '@nestjs/common';
import * as line from '@line/bot-sdk';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class LineService {
  private readonly channelAccessToken: string;
  private readonly lineClient: line.Client;
  private readonly prisma: PrismaService;

  constructor() {
    this.channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN || '';

    if (!this.channelAccessToken) {
      throw new Error('LINE_CHANNEL_ACCESS_TOKEN is not set');
    }

    this.lineClient = new line.Client({
      channelAccessToken: this.channelAccessToken,
    });
  }

  /**
   * LINEメッセージを送信
   * @param userId LINE User ID
   * @param message 送信するメッセージ
   */
  async sendMessage(userId: string, message: string): Promise<void> {
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

  /**
   * 複数メッセージを送信
   * @param userId LINE User ID
   * @param messages 送信するメッセージ配列
   */
  async sendMessages(userId: string, messages: string[]): Promise<void> {
    try {
      const messageObjects = messages.map((text) => ({
        type: 'text' as const,
        text: text,
      }));

      await this.lineClient.pushMessage(userId, messageObjects);
    } catch (error) {
      console.error('LINE送信エラー:', error);
      throw error;
    }
  }

  /**
   * アカウント連携ボタンを送信
   * @param userId LINE User ID
   * @param linkUrl 連携用URL
   */
  async sendAccountLinkButton(userId: string, linkUrl: string): Promise<void> {
    try {
      await this.lineClient.pushMessage(userId, {
        type: 'template',
        altText: 'アカウント連携',
        template: {
          type: 'buttons',
          text: 'Webアプリとアカウントを連携してください',
          actions: [
            {
              type: 'uri',
              label: 'アカウント連携',
              uri: linkUrl,
            },
          ],
        },
      });
    } catch (error) {
      console.error('アカウント連携ボタン送信エラー:', error);
      throw error;
    }
  }

  async handleEvent(event: any, lineLoginId: number) {
    switch (event.type) {
      case 'follow':
        return this.handleFollow(event);

      case 'unfollow':
        return this.handleUnfollow(event);

      default:
        return;
    }
  }

  private async handleFollow(event: any) {
    const lineMessagingId = event.source.userId;
    console.log("lineMessagingId", lineMessagingId);
  }
  private async handleUnfollow(event: any) {}
}
