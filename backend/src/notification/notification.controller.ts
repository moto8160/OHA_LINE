import { Controller, Post, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // 手動LINE送信時（明日のLINEを送信）
  @Post('send')
  async sendNotification(@CurrentUser() user: any) {
    await this.notificationService.sendTodos(user.id, 'tomorrow');
  }
}
