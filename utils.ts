
import { WorkDay, UserSettings, Advance } from './types';
import { 
  DEFAULT_SALARY, 
  HOURS_IN_MONTH, 
  BPS_RATE, 
  EXTRA_HOUR_MULTIPLIER, 
  URUGUAY_HOLIDAYS
} from './constants';

/**
 * Retorna la fecha en formato YYYY-MM-DD local
 */
export const getLocalDateString = (date: Date = new Date()): string => {
  const offset = date.getTimezoneOffset();
  const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
  return adjustedDate.toISOString().split('T')[0];
};

/**
 * Calcula la duración neta de la jornada (horas trabajadas - descanso no remunerado)
 */
export const calculateDuration = (day: WorkDay): number => {
  if (day.type !== 'work') return 0;
  if (!day.entryTime || !day.exitTime) return 0;

  const start = new Date(day.entryTime).getTime();
  const end = new Date(day.exitTime).getTime();
  
  let durationMs = end - start;

  if (day.breakStartTime && day.breakEndTime) {
    const breakStart = new Date(day.breakStartTime).getTime();
    const breakEnd = new Date(day.breakEndTime).getTime();
    const breakDuration = breakEnd - breakStart;
    
    if (breakDuration > 0) {
      durationMs -= breakDuration;
    }
  }

  const hours = durationMs / (1000 * 60 * 60);
  return Math.max(0, hours);
};

export const getDayFinancials = (day: WorkDay, hourlyRate: number, standardHours: number = 8) => {
  if (day.type !== 'work') {
    return { duration: 0, normalHours: 0, extraHours: 0, gross: 0 };
  }
  
  const duration = calculateDuration(day);
  const normalHours = Math.min(standardHours, duration);
  const extraHours = Math.max(0, duration - standardHours);

  const gross = (normalHours * hourlyRate) + (extraHours * hourlyRate * EXTRA_HOUR_MULTIPLIER);
  
  return {
    duration,
    normalHours,
    extraHours,
    gross
  };
};

export const formatCurrency = (amount: number, privacyMode: boolean = false) => {
  if (privacyMode) return '••••••';
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

export const isHoliday = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  return URUGUAY_HOLIDAYS.some(h => h.month === d.getMonth() && h.day === d.getDate());
};

export const isSunday = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  return d.getDay() === 0;
};

export const getWorkDayStatus = (day: WorkDay) => {
  if (day.type !== 'work') return 'complete';
  if (!day.entryTime || !day.exitTime) return 'incomplete';
  return 'complete';
};

export const getSummary = (workDays: WorkDay[], settings: UserSettings, advances: Advance[]) => {
  const hourlyRate = settings.monthlySalary / HOURS_IN_MONTH;
  let totalGross = 0;
  let totalNormalHours = 0;
  let totalExtraHours = 0;
  let totalAllowances = 0;

  workDays.forEach(day => {
    const { gross, normalHours, extraHours } = getDayFinancials(day, hourlyRate, settings.standardJornadaHours);
    totalGross += gross;
    totalNormalHours += normalHours;
    totalExtraHours += extraHours;
    totalAllowances += (day.allowance || 0);
  });

  // Usar el bpsRate personalizado desde ajustes. Si no existe, usar el estándar.
  const rate = (settings.bpsRate ?? 22) / 100;
  const bpsDiscount = totalGross * rate;
  const totalAdvances = advances.reduce((acc, curr) => acc + curr.amount, 0);
  const netPay = (totalGross - bpsDiscount - totalAdvances) + totalAllowances;

  return {
    hourlyRate,
    totalGross,
    totalNormalHours,
    totalExtraHours,
    bpsDiscount,
    totalAdvances,
    totalAllowances,
    netPay
  };
};

export const generateCSV = (workDays: WorkDay[]) => {
  const headers = ['Fecha', 'Estado', 'Entrada', 'Inicio Descanso', 'Fin Descanso', 'Salida', 'Horas Netas', 'Extras', 'Viáticos'];
  const rows = workDays.map(day => {
    const dur = calculateDuration(day);
    const extra = Math.max(0, dur - 8);
    return [
      day.date,
      day.type !== 'work' ? 'LIBRE' : 'TRABAJO',
      day.entryTime ? new Date(day.entryTime).toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' }) : '-',
      day.breakStartTime ? new Date(day.breakStartTime).toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' }) : '-',
      day.breakEndTime ? new Date(day.breakEndTime).toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' }) : '-',
      day.exitTime ? new Date(day.exitTime).toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' }) : '-',
      dur.toFixed(2),
      extra.toFixed(2),
      (day.allowance || 0).toString()
    ];
  });

  const content = [headers, ...rows].map(e => e.join(',')).join('\n');
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `registros_laboral_${getLocalDateString()}.csv`);
  link.click();
};
