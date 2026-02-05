import { Controller, Post, Req } from '@nestjs/common';
import { LineService } from './line.service';

@Controller('line')
export class LineController {
  constructor(private readonly lineService: LineService) {}

  // おはLINEからのイベントを受け取る
  @Post('webhook')
  async webhook(@Req() req: any) {
    for (const event of req.body.events) {
      console.log(event);
      await this.lineService.handleEvent(event);
    }
  }
}
