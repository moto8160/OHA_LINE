import { Injectable } from '@nestjs/common';
import * as line from '@line/bot-sdk';

@Injectable()
export class LineService {
  private readonly channelAccessToken: string;
  private readonly lineClient: line.Client;

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
}
