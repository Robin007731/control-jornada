
export enum RegistrationType {
  ENTRY = 'ENTRY',
  BREAK_START = 'BREAK_START',
  BREAK_END = 'BREAK_END',
  EXIT = 'EXIT'
}

export interface WorkDay {
  id: string;
  date: string; // ISO format
  entryTime?: string;
  breakStartTime?: string;
  breakEndTime?: string;
  exitTime?: string;
  isHalfDay: boolean;
  isManual: boolean;
  isDayOff: boolean; // Added for day off support
  status: 'incomplete' | 'complete';
  // Allowance field for extra earnings like viáticos
  allowance?: number;
}

export interface Advance {
  id: string;
  date: string;
  amount: number;
  note?: string;
}

export interface UserSettings {
  workerName: string;
  monthlySalary: number;
  passwordHash: string;
  onboardingComplete: boolean;
  simplifiedMode: boolean;
}

export interface AppState {
  workDays: WorkDay[];
  advances: Advance[];
  settings: UserSettings;
}
