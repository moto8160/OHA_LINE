import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';

export interface LineProfile {
  id: string;
  displayName: string;
  pictureUrl?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * LINE認証後のユーザー検証・登録処理
   */
  async validateLineUser(profile: LineProfile) {
    const { id: lineUserId, displayName, pictureUrl } = profile;

    // ユーザーがDBに存在するか確認
    let user = await this.prisma.user.findUnique({
      where: { lineUserId },
    });

    // 存在しない場合は新規登録
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          lineUserId,
          lineDisplayName: displayName,
          linePictureUrl: pictureUrl
        },
      });
    } else {
      // 既存ユーザーの場合は情報を更新（名前や画像は変更される可能性があるため）
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          lineDisplayName: displayName,
          linePictureUrl: pictureUrl,
        },
      });
    }

    return user;
  }

  /**
   * JWTトークンを生成
   */
  async generateToken(userId: number) {
    const payload = { sub: userId };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  /**
   * JWTトークンからユーザー情報を取得
   */
  async validateToken(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
}
