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
    // 署名検証
    const isValid = line.validateSignature(
      JSON.stringify(body),
      this.channelSecret,
      signature,
    );

    if (!isValid) {
      throw new Error('Invalid signature');
    }

    // イベント処理
    const events = body.events || [];
    for (const event of events) {
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
   * アカウント連携がまだの場合は案内メッセージを送信
   */
  private async handleFollowEvent(lineMessagingId: string): Promise<void> {
    try {
      // すでに連携済みかチェック
      const existingUser = await this.prisma.user.findFirst({
        where: { lineMessagingId },
      });

      if (existingUser) {
        // すでに連携済み
        await this.lineService.sendMessage(
          lineMessagingId,
          '友達追加ありがとうございます！アカウント連携済みです。',
        );
      } else {
        // 連携案内メッセージを送信
        await this.lineService.sendMessage(
          lineMessagingId,
          '友達追加ありがとうございます！\n\nWebアプリでログインした後、「アカウント連携」から連携を完了してください。',
        );
      }

      console.log(`Follow event受信: ${lineMessagingId}`);
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
