import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET!,
    });
  }

  /**
   * JWTトークンのペイロードを検証し、ユーザー情報を返す
   */
  async validate(payload: any) {
    const user = await this.authService.validateToken(payload.sub);

    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }
}
