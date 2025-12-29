
export enum RegistrationType {
  ENTRY = 'ENTRY',
  BREAK_START = 'BREAK_START',
  BREAK_END = 'BREAK_END',
  EXIT = 'EXIT'
}

export type DayType = 'work' | 'off' | 'vacation' | 'medical';

export interface WorkDay {
  id: string;
  date: string; // ISO format YYYY-MM-DD
  type: DayType;
  entryTime?: string;
  breakStartTime?: string;
  breakEndTime?: string;
  exitTime?: string;
  isHalfDay: boolean;
  isManual: boolean;
  status: 'incomplete' | 'complete';
  allowance?: number;
  note?: string;
}

export interface Advance {
  id: string;
  date: string;
  amount: number;
  note?: string;
}

export interface UserSettings {
  workerName: string;
  workplaceName: string;
  monthlySalary: number;
  passwordHash: string;
  onboardingComplete: boolean;
  simplifiedMode: boolean;
  notificationsEnabled?: boolean;
}

export interface AppState {
  workDays: WorkDay[];
  advances: Advance[];
  settings: UserSettings;
}
