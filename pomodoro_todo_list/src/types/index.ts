export interface KanbanCard {
  id: string;
  title: string;
  description: unknown;
  status: 'pending' | 'doing' | 'done';
  createdAt: string;
  pomodoroCount?: number;
  shortBreakCount?: number;
  longBreakCount?: number;
}

export interface DayData {
  date: string; // "YYYY-MM-DD"
  cards: KanbanCard[];
}

export type PomodoroPhase = 'work' | 'short-break' | 'long-break';
export type PomodoroStatus = 'idle' | 'running' | 'paused' | 'session-done' | 'break-done';
