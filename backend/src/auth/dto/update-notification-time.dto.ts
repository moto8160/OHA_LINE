import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class UpdateNotificationTimeDto {
  @IsNotEmpty({ message: '通知時刻を入力してください' })
  @IsString({ message: '通知時刻は文字列である必要があります' })
  @Matches(/^(?:[01]\d|2[0-3]):[0-5]\d$/, {
    message: '通知時刻はHH:mm形式で入力してください（例: 09:00）',
  })
  notificationTime: string;
}
