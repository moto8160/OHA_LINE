import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { LineService } from './line.service';

@Controller('line')
export class LineController {
  constructor(private readonly lineService: LineService) {}

  // おはLINEからのイベントを受け取る
  @Post('webhook')
  async webhook(@Req() req: any) {
    for (const event of req.body.events) {
      await this.lineService.handleEvent(event);
    }
  }
}
