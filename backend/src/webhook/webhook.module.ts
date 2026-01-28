import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { PrismaService } from '../prisma.service';
import { LinkService } from '../link/link.service';
import { LineService } from '../line/line.service';

@Module({
  controllers: [WebhookController],
  providers: [WebhookService, PrismaService, LinkService, LineService],
})
export class WebhookModule {}
