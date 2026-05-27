import { IsIn } from 'class-validator';

export class IncrementStatDto {
  @IsIn(['pomodoroCount', 'shortBreakCount', 'longBreakCount'])
  stat: 'pomodoroCount' | 'shortBreakCount' | 'longBreakCount';
}
