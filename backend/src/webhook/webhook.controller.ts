// import { Controller, Post, Body, Headers, HttpCode } from '@nestjs/common';
// import { WebhookService } from './webhook.service';

// @Controller('webhook')
// export class WebhookController {
//   constructor(private readonly webhookService: WebhookService) {}

//   /**
//    * LINE Webhook受信エンドポイント
//    * POST /webhook
//    */
//   @Post()
//   @HttpCode(200)
//   async handleWebhook(
//     @Body() body: any,
//     @Headers('x-line-signature') signature: string,
//   ) {
//     try {
//       // 署名検証とイベント処理
//       await this.webhookService.handleEvents(body, signature);
//       return { success: true };
//     } catch (error) {
//       console.error('Webhook処理エラー:', error);
//       return { success: false };
//     }
//   }
// }
