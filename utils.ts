
import { WorkDay, UserSettings, Advance } from './types';
import { 
  DEFAULT_SALARY, 
  HOURS_IN_MONTH, 
  BPS_RATE, 
  EXTRA_HOUR_MULTIPLIER, 
  NORMAL_JORNADA_HOURS,
  URUGUAY_HOLIDAYS
} from './constants';

export const calculateDuration = (day: WorkDay): number => {
  if (!day.entryTime || !day.exitTime) return 0;

  const start = new Date(day.entryTime).getTime();
  const end = new Date(day.exitTime).getTime();
  let durationMs = end - start;

  if (day.breakStartTime && day.breakEndTime) {
    const breakStart = new Date(day.breakStartTime).getTime();
    const breakEnd = new Date(day.breakEndTime).getTime();
    durationMs -= (breakEnd - breakStart);
  }

  return Math.max(0, durationMs / (1000 * 60 * 60)); // Hours
};

export const getDayFinancials = (day: WorkDay, hourlyRate: number) => {
  const duration = calculateDuration(day);
  const normalHours = Math.min(NORMAL_JORNADA_HOURS, duration);
  const extraHours = Math.max(0, duration - NORMAL_JORNADA_HOURS);

  const gross = (normalHours * hourlyRate) + (extraHours * hourlyRate * EXTRA_HOUR_MULTIPLIER);
  return {
    duration,
    normalHours,
    extraHours,
    gross
  };
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);
};

export const isHoliday = (date: Date) => {
  return URUGUAY_HOLIDAYS.some(h => h.month === date.getMonth() && h.day === date.getDate());
};

export const isSunday = (date: Date) => date.getDay() === 0;

export const getWorkDayStatus = (day: WorkDay) => {
  if (!day.entryTime || !day.exitTime) return 'incomplete';
  return 'complete';
};

export const getSummary = (workDays: WorkDay[], settings: UserSettings, advances: Advance[]) => {
  const hourlyRate = settings.monthlySalary / HOURS_IN_MONTH;
  let totalGross = 0;
  let totalNormalHours = 0;
  let totalExtraHours = 0;

  workDays.forEach(day => {
    const { gross, normalHours, extraHours } = getDayFinancials(day, hourlyRate);
    totalGross += gross;
    totalNormalHours += normalHours;
    totalExtraHours += extraHours;
  });

  const bpsDiscount = totalGross * BPS_RATE;
  const totalAdvances = advances.reduce((acc, curr) => acc + curr.amount, 0);
  const netPay = totalGross - bpsDiscount - totalAdvances;

  return {
    hourlyRate,
    totalGross,
    totalNormalHours,
    totalExtraHours,
    bpsDiscount,
    totalAdvances,
    netPay
  };
};

export const generateCSV = (workDays: WorkDay[]) => {
  const headers = ['Fecha', 'Entrada', 'Salida', 'Horas Totales', 'Horas Extra'];
  const rows = workDays.map(day => {
    const dur = calculateDuration(day);
    const extra = Math.max(0, dur - 8);
    return [
      new Date(day.date).toLocaleDateString('es-UY'),
      day.entryTime ? new Date(day.entryTime).toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' }) : '-',
      day.exitTime ? new Date(day.exitTime).toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' }) : '-',
      dur.toFixed(2),
      extra.toFixed(2)
    ];
  });

  const content = [headers, ...rows].map(e => e.join(',')).join('\n');
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `registros_laborales_${new Date().toISOString().split('T')[0]}.csv`);
  link.click();
};
