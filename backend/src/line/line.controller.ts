import { Controller, Post, Req, UseGuards } from '@nestjs/common';
import { LineService } from './line.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Controller('line')
@UseGuards(JwtAuthGuard)
export class LineController {
  constructor(private readonly lineService: LineService) {}

  @Post('webhook')
  async webhook(@Req() req: any, @CurrentUser() user: any) {
    const events = req.body.events;

    console.log(events);
    console.log('user', user);

    for (const event of events) {
      await this.lineService.handleEvent(event, user.lineLoginId);
    }

    return 'ok';
  }
}
