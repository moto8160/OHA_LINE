import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { LinkService } from '../link/link.service';
import { LineService } from '../line/line.service';
import * as line from '@line/bot-sdk';

@Injectable()
export class WebhookService {
  private readonly channelSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly linkService: LinkService,
    private readonly lineService: LineService,
  ) {
    this.channelSecret = process.env.LINE_CHANNEL_SECRET || '';

    if (!this.channelSecret) {
      throw new Error('LINE_CHANNEL_SECRET is not set');
    }
  }

  /**
   * Webhookイベントを処理
   */
  async handleEvents(body: any, signature: string): Promise<void> {
    console.log('=== Webhook受信 ===');
    console.log('Body:', JSON.stringify(body, null, 2));

    // 署名検証
    const isValid = line.validateSignature(
      JSON.stringify(body),
      this.channelSecret,
      signature,
    );

    if (!isValid) {
      console.error('署名検証失敗');
      throw new Error('Invalid signature');
    }

    console.log('署名検証成功');

    // イベント処理
    const events = body.events || [];
    console.log(`イベント数: ${events.length}`);

    for (const event of events) {
      console.log(`イベントタイプ: ${event.type}`);
      await this.handleEvent(event);
    }
  }

  /**
   * 個別イベント処理
   */
  private async handleEvent(event: any): Promise<void> {
    const { type, source } = event;

    // ユーザーIDを取得
    const lineMessagingId = source?.userId;
    if (!lineMessagingId) {
      return;
    }

    // フォローイベント（友達追加）の処理
    if (type === 'follow') {
      await this.handleFollowEvent(lineMessagingId);
    }

    // アンフォローイベントの処理
    if (type === 'unfollow') {
      await this.handleUnfollowEvent(lineMessagingId);
    }

    // アカウント連携イベントの処理
    if (type === 'accountLink') {
      await this.handleAccountLinkEvent(event, lineMessagingId);
    }
  }

  /**
   * 友達追加時の処理
   * lineLoginIdと一致するユーザーがいれば自動的にlineMessagingIdを登録
   */
  private async handleFollowEvent(lineMessagingId: string): Promise<void> {
    try {
      console.log(`=== Follow Event処理開始 ===`);
      console.log(`lineMessagingId: ${lineMessagingId}`);

      // すでに連携済みかチェック
      const existingUser = await this.prisma.user.findFirst({
        where: { lineMessagingId },
      });

      console.log(
        `既存ユーザー検索結果:`,
        existingUser ? `User ID: ${existingUser.id}` : 'なし',
      );

      if (existingUser) {
        // すでに連携済み
        await this.lineService.sendMessage(
          lineMessagingId,
          '友達追加ありがとうございます！\nアカウント連携済みです。Todo通知をお送りします。',
        );
        console.log(`User ${existingUser.id} はすでに連携済み`);
        return;
      }

      // lineLoginIdが一致するユーザーを検索（自動紐付け）
      console.log(`lineLoginIdでユーザー検索: ${lineMessagingId}`);
      const userByLoginId = await this.prisma.user.findFirst({
        where: { lineLoginId: lineMessagingId },
      });

      console.log(
        `lineLoginId検索結果:`,
        userByLoginId ? `User ID: ${userByLoginId.id}` : 'なし',
      );

      if (userByLoginId) {
        // 自動的にlineMessagingIdを登録
        await this.prisma.user.update({
          where: { id: userByLoginId.id },
          data: { lineMessagingId },
        });

        await this.lineService.sendMessage(
          lineMessagingId,
          '友達追加ありがとうございます！\nアカウント連携が完了しました🎉\n\nTodo通知を受け取れるようになりました。',
        );

        console.log(
          `✓ User ${userByLoginId.id} のlineMessagingIdを自動登録しました: ${lineMessagingId}`,
        );
      } else {
        // 該当ユーザーなし→案内メッセージ
        console.log(`該当ユーザーなし。全ユーザーのlineLoginIdを確認:`);
        const allUsers = await this.prisma.user.findMany({
          select: { id: true, lineLoginId: true, lineMessagingId: true },
        });
        console.log('全ユーザー:', JSON.stringify(allUsers, null, 2));

        await this.lineService.sendMessage(
          lineMessagingId,
          '友達追加ありがとうございます！\n\n先にWebアプリでLINEログインしてから、もう一度友達追加してください。\n\nhttps://ohaline-production.vercel.app',
        );

        console.log(
          `⚠ lineLoginId=${lineMessagingId}に一致するユーザーが見つかりません`,
        );
      }
    } catch (error) {
      console.error('Follow event処理エラー:', error);
    }
  }

  /**
   * アンフォロー時の処理
   */
  private async handleUnfollowEvent(lineMessagingId: string): Promise<void> {
    try {
      const user = await this.prisma.user.findFirst({
        where: { lineMessagingId },
      });

      if (user) {
        // lineMessagingIdをnullに設定
        await this.prisma.user.update({
          where: { id: user.id },
          data: { lineMessagingId: null },
        });

        console.log(`User ${user.id} のlineMessagingIdをクリアしました`);
      }
    } catch (error) {
      console.error('Unfollow event処理エラー:', error);
    }
  }

  /**
   * アカウント連携イベント処理
   */
  private async handleAccountLinkEvent(
    event: any,
    lineMessagingId: string,
  ): Promise<void> {
    try {
      const { link } = event;
      const { result, nonce } = link;

      if (result === 'ok' && nonce) {
        // nonceはlinkTokenとして使用
        const user = await this.linkService.getUserByLinkToken(nonce);

        if (user) {
          // アカウント連携完了
          await this.linkService.completeLinking(user.id, lineMessagingId);

          console.log(
            `User ${user.id} のアカウント連携完了: ${lineMessagingId}`,
          );

          // 連携完了メッセージ
          await this.lineService.sendMessage(
            lineMessagingId,
            'アカウント連携が完了しました！\nTodo通知を受け取れるようになりました。',
          );
        } else {
          console.log(`無効なlinkToken: ${nonce}`);
        }
      }
    } catch (error) {
      console.error('AccountLink event処理エラー:', error);
    }
  }
}
