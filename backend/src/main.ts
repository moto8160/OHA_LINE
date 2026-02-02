import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // グローバルバリデーションパイプを有効化
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // DTOに定義されていないプロパティを除去
      forbidNonWhitelisted: true, // 定義されていないプロパティがあればエラー
      transform: true, // 自動的に型変換
    }),
  );

  app.enableCors({
    origin: ['http://localhost:3000', 'https://oha-line.vercel.app'],
    credentials: true, // Cookie / 認証を使うなら
  });

  await app.listen(process.env.PORT ?? 5000);
}
bootstrap();
