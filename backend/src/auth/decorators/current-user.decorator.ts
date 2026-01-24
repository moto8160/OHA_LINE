import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * 現在のユーザー情報を取得するデコレーター
 * @CurrentUser() で使用可能
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
