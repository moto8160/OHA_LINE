import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

const FIXED_USER_ID = 1;
const FIXED_USER = {
  lineUserId: 'U1234567890abcdef1234567890abcdef',
  lineToken: 'dummy_token_for_development',
  notificationTime: '09:00',
};

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getOrCreateUser() {
    let user = await this.prisma.user.findUnique({
      where: { id: FIXED_USER_ID },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          id: FIXED_USER_ID,
          ...FIXED_USER,
        },
      });
    }

    return user;
  }

  async getUser() {
    return this.prisma.user.findUnique({
      where: { id: FIXED_USER_ID },
    });
  }
}
