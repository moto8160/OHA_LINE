import {
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsDateString,
} from 'class-validator';

export class CreateTodoDto {
  @IsNotEmpty({ message: 'Todoの内容を入力してください' })
  @IsString({ message: 'Todoの内容は文字列である必要があります' })
  @MinLength(1, { message: 'Todoの内容は1文字以上である必要があります' })
  @MaxLength(200, { message: 'Todoの内容は200文字以下である必要があります' })
  title: string;

  @IsNotEmpty({ message: '日付を入力してください' })
  @IsDateString({}, { message: '日付はYYYY-MM-DD形式である必要があります' })
  date: string;
}
