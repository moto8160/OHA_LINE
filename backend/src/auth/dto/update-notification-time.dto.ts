import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class UpdateNotificationTimeDto {
  @IsNotEmpty({ message: '通知時刻を入力してください' })
  @IsString({ message: '通知時刻は文字列である必要があります' })
  @Matches(/^(?:[01]\d|2[0-3]):(00|30)$/, {
    message: '通知時刻は30分おき（HH:00, HH:30）である必要があります',
  })
  notificationTime: string;
}
