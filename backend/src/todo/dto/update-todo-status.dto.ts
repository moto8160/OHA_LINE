import { IsBoolean } from 'class-validator';

export class UpdateTodoStatusDto {
  @IsBoolean()
  isCompleted: boolean;
}
