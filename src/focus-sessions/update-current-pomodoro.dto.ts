// dto/update-current-pomodoro.dto.ts

import { IsString, IsNumber, IsEnum } from 'class-validator';

export class UpdateCurrentPomodoroDto {
  @IsString()
  user_id: string;

  @IsNumber()
  current_pomodoro_number: number;

  @IsNumber()
  current_cycle_number: number;

  @IsEnum(['pomodoro', 'short-break', 'long-break'])
  session_status: 'pomodoro' | 'short-break' | 'long-break';
}
