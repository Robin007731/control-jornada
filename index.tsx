
import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  Clock, History as HistoryIcon, Settings as SettingsIcon, ShieldCheck, 
  ArrowRight, Check, Plus, Play, Coffee, LogOut, CheckCircle, AlertCircle, 
  Download, Trash2, Edit2, Copy, Calendar, Save, User, Wallet, Shield, 
  RefreshCw, Upload, Smartphone, X, Lock, TrendingUp, Search, Info, 
  CalendarRange, ChevronRight, FileText, Moon, Sun
} from 'lucide-react';

// --- CONSTANTES ---
const URUGUAY_HOLIDAYS = [
  { month: 0, day: 1, name: 'Año Nuevo' },
  { month: 0, day: 6, name: 'Día de Reyes' },
  { month: 3, day: 19, name: 'Desembarco de los 33' },
  { month: 4, day: 1, name: 'Día de los Trabajadores' },
  { month: 4, day: 18, name: 'Batalla de las Piedras' },
  { month: 5, day: 19, name: 'Natalicio de Artigas' },
  { month: 6, day: 18, name: 'Jura de la Constitución' },
  { month: 7, day: 25, name: 'Declaratoria de la Independencia' },
  { month: 9, day: 12, name: 'Día de la Raza' },
  { month: 10, day: 2, name: 'Día de los Difuntos' },
  { month: 11, day: 25, name: 'Día de la Familia' },
];

const DEFAULT_SALARY = 29267;
const HOURS_IN_MONTH = 160;

// --- TIPOS ---
type DayType = 'work' | 'free';

interface WorkDay {
  id: string;
  date: string;
  type: DayType;
  entryTime?: string;
  breakStartTime?: string;
  breakEndTime?: string;
  exitTime?: string;
  isHalfDay: boolean;
  status: 'incomplete' | 'complete';
  allowance: number;
}

interface Advance {
  id: string;
  date: string;
  amount: number;
  note?: string;
}

interface UserSettings {
  workerName: string;
  monthlySalary: number;
  hourlyRate: number;
  useHourlyRate: boolean;
  passwordHash: string;
  onboardingComplete: boolean;
  simplifiedMode: boolean;
  bpsRate: number;
  extraMultiplier: number;
  specialDayMultiplier: number;
}

// --- UTILIDADES ---
const formatCurrency = (amount: number) => 
  new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);

const isHoliday = (date: Date) => 
  URUGUAY_HOLIDAYS.some(h => h.month === date.getMonth() && h.day === date.getDate());

const isSunday = (date: Date) => date.getDay() === 0;

const calculateDuration = (day: WorkDay): number => {
  if (day.type === 'free') return 0;
  if (!day.entryTime || !day.exitTime) return 0;
  const start = new Date(day.entryTime).getTime();
  const end = new Date(day.exitTime).getTime();
  let durationMs = end - start;
  if (day.breakStartTime && day.breakEndTime) {
    const bStart = new Date(day.breakStartTime).getTime();
    const bEnd = new Date(day.breakEndTime).getTime();
    durationMs -= Math.max(0, (bEnd - bStart));
  }
  return Math.max(0, durationMs / (1000 * 60 * 60));
};

const getDayFinancials = (day: WorkDay, settings: UserSettings) => {
  if (day.type === 'free') return { duration: 0, normalHours: 0, extraHours: 0, gross: 0, isSpecial: false };
  
  const duration = calculateDuration(day);
  const date = new Date(day.date);
  const isSpecial = isSunday(date) || isHoliday(date);
  
  const baseRate = settings.useHourlyRate ? settings.hourlyRate : (settings.monthlySalary / HOURS_IN_MONTH);
  const multiplier = isSpecial ? settings.specialDayMultiplier : 1;
  
  const normalHours = Math.min(8, duration);
  const extraHours = Math.max(0, duration - 8);
  
  const gross = (normalHours * baseRate * multiplier) + 
                (extraHours * baseRate * settings.extraMultiplier * multiplier);
  
  return { duration, normalHours, extraHours, gross, isSpecial };
};

const getSummary = (workDays: WorkDay[], settings: UserSettings, advances: Advance[]) => {
  let totalGross = 0, totalNormal = 0, totalExtra = 0, totalAllowances = 0, workDaysCount = 0, freeDaysCount = 0;
  
  workDays.forEach(day => {
    if (day.type === 'free') {
      freeDaysCount++;
    } else {
      const { gross, normalHours, extraHours } = getDayFinancials(day, settings);
      totalGross += gross;
      totalNormal += normalHours;
      totalExtra += extraHours;
      totalAllowances += (day.allowance || 0);
      if (day.status === 'complete') workDaysCount++;
    }
  });

  const bpsDiscount = totalGross * (settings.bpsRate / 100);
  const totalAdvances = advances.reduce((acc, curr) => acc + curr.amount, 0);
  const netPay = (totalGross - bpsDiscount - totalAdvances) + totalAllowances;
  
  return { totalGross, totalNormal, totalExtra, bpsDiscount, totalAdvances, totalAllowances, netPay, workDaysCount, freeDaysCount };
};

// --- COMPONENTES ---

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-slide-up border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <h3 className="font-bold text-lg text-gray-800 tracking-tight">{title}</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};

const Onboarding: React.FC<{ onComplete: (name: string) => void }> = ({ onComplete }) => {
  const [name, setName] = useState('');
  const [step, setStep] = useState(1);
  const [accepted, setAccepted] = useState(false);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-white">
      <div className="max-w-xs w-full space-y-6 animate-fade-in">
        {step === 1 && (
          <div className="text-center space-y-8">
            <div className="bg-white/10 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto backdrop-blur-xl border border-white/20 shadow-2xl">
              <ShieldCheck className="w-10 h-10 text-blue-400" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black italic tracking-tighter uppercase leading-none text-white">Registro laboral</h1>
              <p className="text-slate-400 font-bold text-[10px] tracking-widest uppercase italic">Tu tiempo y tus ganancias, bajo tu control.</p>
            </div>
            <div className="bg-white text-gray-900 p-6 rounded-3xl shadow-2xl space-y-6 text-left">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-gray-800">¡Hola!</h2>
                <p className="text-gray-400 text-xs">Ingresa tu nombre para comenzar tu registro.</p>
              </div>
              <input type="text" placeholder="Tu Nombre" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:border-blue-500 outline-none font-bold text-lg transition-all" value={name} onChange={(e) => setName(e.target.value)} />
              <button disabled={!name.trim()} onClick={() => setStep(2)} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
                CONTINUAR <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white text-gray-900 p-6 rounded-3xl shadow-2xl space-y-5 animate-slide-up">
            <h2 className="text-xl font-black text-gray-800 uppercase italic">Privacidad Local</h2>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-[10px] text-gray-600 space-y-3 h-64 overflow-y-auto leading-relaxed">
              <p className="font-black text-blue-600 uppercase border-b border-gray-200 pb-1">1. Datos Seguros</p>
              <p>Toda la información reside en tu teléfono. No enviamos tus datos a ningún servidor externo.</p>
              <p className="font-black text-blue-600 uppercase border-b border-gray-200 pb-1">2. Cálculos Uruguay</p>
              <p>Los cálculos de BPS (22%) y horas extras son referenciales según la normativa general vigente.</p>
            </div>
            
            <label className="flex items-start gap-3 p-2 cursor-pointer group">
              <div className="relative mt-0.5">
                <input type="checkbox" className="peer opacity-0 absolute w-5 h-5" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
                <div className="w-5 h-5 bg-gray-100 border-2 border-gray-200 rounded-md peer-checked:bg-slate-900 peer-checked:border-slate-900 flex items-center justify-center transition-all">
                  <Check className="w-3 h-3 text-white" />
                </div>
              </div>
              <span className="text-[10px] font-bold text-gray-500 uppercase leading-tight select-none">Acepto los términos y el uso local de mis datos.</span>
            </label>

            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="flex-1 py-4 font-bold text-gray-400 text-xs uppercase">Atrás</button>
              <button disabled={!accepted} onClick={() => onComplete(name)} className="flex-[2] bg-slate-900 text-white py-4 rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-all">COMENZAR</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Dashboard: React.FC<{ workDays: WorkDay[]; settings: UserSettings; advances: Advance[]; onAction: (day: WorkDay) => void }> = ({ workDays, settings, advances, onAction }) => {
  const summary = getSummary(workDays, settings, advances);
  const today = new Date();
  const todayStr = today.toDateString();
  const currentDay = workDays.find(d => new Date(d.date).toDateString() === todayStr) || { 
    id: crypto.randomUUID(), 
    date: today.toISOString(), 
    type: 'work',
    isHalfDay: false, 
    status: 'incomplete', 
    allowance: 0 
  };

  const registerAction = () => {
    const now = new Date().toISOString();
    let updated: WorkDay = { ...currentDay, type: 'work' };
    if (!updated.entryTime) updated.entryTime = now;
    else if (!settings.simplifiedMode && !updated.breakStartTime) updated.breakStartTime = now;
    else if (!settings.simplifiedMode && !updated.breakEndTime) updated.breakEndTime = now;
    else if (!updated.exitTime) { updated.exitTime = now; updated.status = 'complete'; }
    onAction(updated);
  };

  const markAsFree = () => {
    onAction({ ...currentDay, type: 'free', status: 'complete', entryTime: undefined, exitTime: undefined });
  };

  const getNextAction = () => {
    if (currentDay.type === 'free') return { label: 'DÍA LIBRE', icon: <Sun className="w-5 h-5" />, color: 'bg-green-500' };
    if (!currentDay.entryTime) return { label: 'REGISTRAR ENTRADA', icon: <Play className="w-5 h-5 fill-current" />, color: 'bg-blue-600' };
    if (!settings.simplifiedMode) {
      if (!currentDay.breakStartTime) return { label: 'INICIAR DESCANSO', icon: <Coffee className="w-5 h-5" />, color: 'bg-amber-500' };
      if (!currentDay.breakEndTime) return { label: 'FINALIZAR DESCANSO', icon: <Play className="w-5 h-5" />, color: 'bg-emerald-600' };
    }
    if (!currentDay.exitTime) return { label: 'REGISTRAR SALIDA', icon: <LogOut className="w-5 h-5" />, color: 'bg-red-600' };
    return { label: 'JORNADA FINALIZADA', icon: <CheckCircle className="w-5 h-5" />, color: 'bg-slate-800' };
  };

  const action = getNextAction();
  const progress = (summary.totalNormal / HOURS_IN_MONTH) * 100;
  const isDone = currentDay.status === 'complete';

  return (
    <div className="space-y-4 animate-fade-in max-w-xl mx-auto">
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center">
        <p className="text-gray-400 font-black uppercase tracking-widest text-[10px] mb-1">Cobro Neto Estimado</p>
        <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter">{formatCurrency(summary.netPay)}</h2>
        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden mb-2">
          <div className="bg-blue-600 h-full transition-all duration-1000" style={{ width: `${Math.min(100, progress)}%` }}></div>
        </div>
        <div className="flex justify-between w-full text-[9px] font-black text-slate-400 uppercase tracking-wider">
          <span>{summary.totalNormal.toFixed(1)}h acumuladas</span>
          <span>Meta: {HOURS_IN_MONTH}h</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <StatCard icon={<TrendingUp className="text-blue-500" />} label="Extras" value={`${summary.totalExtra.toFixed(1)}h`} bg="bg-blue-50" border="border-blue-100" />
        <StatCard icon={<Sun className="text-amber-500" />} label="Libres" value={summary.freeDaysCount.toString()} bg="bg-amber-50" border="border-amber-100" />
        <StatCard icon={<Wallet className="text-emerald-500" />} label="Viáticos" value={formatCurrency(summary.totalAllowances)} bg="bg-emerald-50" border="border-emerald-100" />
      </div>

      <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter italic">Hoy</h3>
            <p className="text-gray-400 font-bold text-[10px] uppercase">{today.toLocaleDateString('es-UY', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>
          {(isSunday(today) || isHoliday(today)) && (
            <div className="flex flex-col items-end">
              <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-black italic">TARIFA 2X</span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <button 
            disabled={isDone} 
            onClick={registerAction} 
            className={`w-full ${action.color} text-white py-6 rounded-2xl font-black text-lg shadow-xl shadow-blue-900/10 active:scale-95 transition-all flex flex-col items-center gap-2 disabled:opacity-50 disabled:scale-100`}
          >
            {action.icon}
            {action.label}
          </button>

          {!isDone && (
            <button 
              onClick={markAsFree}
              className="w-full bg-slate-50 text-slate-400 py-3 rounded-xl font-black text-xs uppercase tracking-widest border border-slate-100 active:scale-95 transition-all"
            >
              Marcar como día libre
            </button>
          )}
        </div>

        {currentDay.type === 'work' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <TimeBadge label="Entrada" time={currentDay.entryTime} />
            {!settings.simplifiedMode && <>
              <TimeBadge label="Desc. I" time={currentDay.breakStartTime} />
              <TimeBadge label="Desc. F" time={currentDay.breakEndTime} />
            </>}
            <TimeBadge label="Salida" time={currentDay.exitTime} />
          </div>
        )}
        
        {currentDay.type === 'free' && (
          <div className="py-4 bg-amber-50 rounded-2xl border border-amber-100 text-center">
            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Disfrutando de tu día libre</p>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, bg, border }: any) => (
  <div className={`${bg} ${border} p-3 rounded-2xl border flex flex-col items-center text-center`}>
    <div className="mb-1">{icon}</div>
    <p className="text-[8px] font-black text-gray-400 uppercase leading-none mb-1">{label}</p>
    <p className="text-sm font-black text-slate-800 leading-none">{value}</p>
  </div>
);

const TimeBadge = ({ label, time }: { label: string, time?: string }) => (
  <div className="bg-slate-50 p-3 rounded-xl text-center border border-slate-100">
    <span className="block text-[8px] font-black text-slate-400 uppercase mb-1">{label}</span>
    <span className="text-xs font-black text-slate-700">{time ? new Date(time).toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
  </div>
);

// --- HISTORIAL ---
const History: React.FC<{ workDays: WorkDay[]; setWorkDays: React.Dispatch<React.SetStateAction<WorkDay[]>>; settings: UserSettings }> = ({ workDays, setWorkDays, settings }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDay, setEditingDay] = useState<Partial<WorkDay> | null>(null);
  const [filter, setFilter] = useState('');

  const sortedDays = useMemo(() => {
    return [...workDays]
      .filter(d => d.date.includes(filter))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [workDays, filter]);

  const getTimeValue = (iso?: string) => {
    if (!iso) return '';
    const date = new Date(iso);
    return date.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const handleTimeChange = (field: keyof WorkDay, time: string) => {
    if (!editingDay || !editingDay.date) return;
    const datePart = editingDay.date.split('T')[0];
    const newDateTime = `${datePart}T${time}:00`;
    setEditingDay(prev => ({ ...prev, [field]: newDateTime }));
  };

  return (
    <div className="space-y-4 animate-fade-in max-w-xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-black text-slate-800 italic uppercase tracking-tighter">Historial</h2>
        <div className="relative flex-1 max-w-[140px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input 
            type="month" 
            className="w-full pl-9 pr-2 py-2 bg-white rounded-xl border border-gray-100 text-xs font-bold outline-none"
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <button onClick={() => { setEditingDay({ id: crypto.randomUUID(), date: new Date().toISOString().split('T')[0], type: 'work', status: 'complete', isHalfDay: false, allowance: 0 }); setIsModalOpen(true); }} className="p-2 bg-slate-900 text-white rounded-xl shadow-lg active:scale-95 transition-transform">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-2">
        {sortedDays.map(day => {
          const fin = getDayFinancials(day, settings);
          const date = new Date(day.date);
          return (
            <div key={day.id} className={`bg-white rounded-2xl p-4 shadow-sm border-l-4 flex justify-between items-center transition-all ${day.type === 'free' ? 'border-amber-400' : fin.isSpecial ? 'border-emerald-400' : 'border-blue-600'}`}>
              <div className="flex gap-3 items-center">
                <div className="bg-slate-50 rounded-xl p-2 text-center min-w-[50px]">
                  <span className="block text-[8px] font-black text-slate-400 uppercase leading-none mb-1">{date.toLocaleDateString('es-UY', { weekday: 'short' })}</span>
                  <span className="block text-lg font-black text-slate-800 leading-none">{date.getDate()}</span>
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-xs uppercase tracking-tight">{date.toLocaleDateString('es-UY', { month: 'short', year: 'numeric' })}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">
                    {day.type === 'free' ? 'Día Libre' : `${getTimeValue(day.entryTime)} — ${getTimeValue(day.exitTime)}`}
                  </p>
                </div>
              </div>
              <div className="text-right flex items-center gap-4">
                <div>
                  <p className="text-lg font-black text-slate-900 tracking-tighter leading-none">{day.type === 'free' ? '--' : `${fin.duration.toFixed(1)}h`}</p>
                  {day.isHalfDay && day.type === 'work' && <span className="text-[7px] font-black text-emerald-600 uppercase tracking-widest italic">1/2 Turno</span>}
                </div>
                <div className="flex flex-col gap-1">
                  <button onClick={() => { setEditingDay(day); setIsModalOpen(true); }} className="text-gray-300 hover:text-blue-600"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => { if(confirm('¿Eliminar?')) setWorkDays(p => p.filter(d => d.id !== day.id)); }} className="text-gray-300 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          );
        })}
        {sortedDays.length === 0 && (
          <div className="py-20 text-center opacity-10">
             <Calendar className="w-16 h-16 mx-auto mb-2" />
             <p className="font-black text-xs uppercase tracking-widest italic">Sin registros</p>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Gestionar Día">
        <form onSubmit={(e) => { e.preventDefault(); setWorkDays(p => p.some(d => d.id === editingDay!.id) ? p.map(d => d.id === editingDay!.id ? editingDay as WorkDay : d) : [editingDay as WorkDay, ...p]); setIsModalOpen(false); }} className="space-y-4">
          <div className="flex gap-2 p-1 bg-slate-50 rounded-xl">
            <button type="button" onClick={() => setEditingDay({...editingDay, type: 'work'})} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase ${editingDay?.type === 'work' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>Trabajo</button>
            <button type="button" onClick={() => setEditingDay({...editingDay, type: 'free'})} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase ${editingDay?.type === 'free' ? 'bg-amber-500 text-white' : 'text-slate-400'}`}>Libre</button>
          </div>
          
          <div><label className="text-[9px] font-black text-slate-400 uppercase mb-1 block ml-1">Fecha</label><input type="date" required className="w-full px-4 py-3 bg-gray-50 rounded-xl font-bold text-sm" value={editingDay?.date?.split('T')[0] || ''} onChange={(e) => setEditingDay({ ...editingDay, date: e.target.value })} /></div>
          
          {editingDay?.type === 'work' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[9px] font-black text-slate-400 uppercase mb-1 block ml-1">Entrada</label><input type="time" required className="w-full px-4 py-3 bg-gray-50 rounded-xl font-bold text-sm" value={getTimeValue(editingDay?.entryTime)} onChange={(e) => handleTimeChange('entryTime', e.target.value)} /></div>
                <div><label className="text-[9px] font-black text-slate-400 uppercase mb-1 block ml-1">Salida</label><input type="time" required className="w-full px-4 py-3 bg-gray-50 rounded-xl font-bold text-sm" value={getTimeValue(editingDay?.exitTime)} onChange={(e) => handleTimeChange('exitTime', e.target.value)} /></div>
              </div>
              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl">
                <input type="checkbox" id="editHalf" checked={editingDay?.isHalfDay || false} onChange={(e) => setEditingDay({...editingDay, isHalfDay: e.target.checked})} className="w-4 h-4 rounded text-blue-600" />
                <label htmlFor="editHalf" className="text-[10px] font-black text-slate-700 uppercase">Medio Turno (Sin descanso)</label>
              </div>
              <div><label className="text-[9px] font-black text-slate-400 uppercase mb-1 block ml-1">Viáticos ($)</label><input type="number" className="w-full px-4 py-3 bg-gray-50 rounded-xl font-bold text-sm" value={editingDay?.allowance || ''} onChange={(e) => setEditingDay({ ...editingDay, allowance: Number(e.target.value) })} /></div>
            </>
          )}
          
          <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-xl font-black text-base shadow-xl active:scale-95 transition-transform uppercase tracking-widest">Guardar Registro</button>
        </form>
      </Modal>
    </div>
  );
};

// --- AJUSTES ---
const SettingsComp: React.FC<{ settings: UserSettings; setSettings: React.Dispatch<React.SetStateAction<UserSettings>>; advances: Advance[]; onAddAdvance: (adv: Advance) => void; onDeleteAdvance: (id: string) => void; workDays: WorkDay[]; setWorkDays: React.Dispatch<React.SetStateAction<WorkDay[]>> }> = ({ settings, setSettings, advances, onAddAdvance, onDeleteAdvance, workDays, setWorkDays }) => {
  const [isAuth, setIsAuth] = useState(false);
  const [pass, setPass] = useState('');
  const [newAdv, setNewAdv] = useState({ amt: '', note: '' });

  if (!isAuth) return (
    <div className="py-12 px-4 flex flex-col items-center justify-center animate-fade-in">
      <div className="bg-white p-8 rounded-[40px] shadow-2xl w-full max-w-xs text-center space-y-6 text-gray-800 border border-slate-50">
        <div className="bg-slate-900 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-slate-200"><Lock className="w-8 h-8 text-white" /></div>
        <div className="space-y-1">
          <h2 className="text-xl font-black uppercase tracking-tight">Acceso Privado</h2>
          <p className="text-slate-400 text-[8px] uppercase font-black tracking-widest italic">Configuración de {settings.workerName}</p>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); if (pass === settings.passwordHash) setIsAuth(true); else alert('Pin incorrecto'); }} className="space-y-4">
          <input type="password" placeholder="Pin" className="w-full px-4 py-4 rounded-2xl border border-gray-100 text-center text-2xl font-black tracking-[0.5em] outline-none focus:border-blue-500" value={pass} onChange={(e) => setPass(e.target.value)} autoFocus />
          <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-transform">Entrar</button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-20 max-w-xl mx-auto relative">
      <section className="space-y-3">
        <h3 className="text-[10px] font-black text-slate-800 italic flex items-center gap-2 px-1 uppercase tracking-widest"><User className="text-blue-500 w-4 h-4" /> Datos de Trabajador/a</h3>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-50 space-y-4 text-gray-800">
          <div><label className="text-[9px] font-black text-slate-400 uppercase mb-1 block ml-1">Nombre</label><input type="text" value={settings.workerName} onChange={(e) => setSettings(p => ({ ...p, workerName: e.target.value }))} className="w-full px-4 py-3 bg-slate-50 rounded-xl font-bold text-sm outline-none border border-transparent focus:border-blue-500 transition-all" /></div>
          <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="flex-1">
              <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Cálculo de Sueldo</p>
              <div className="flex gap-1.5">
                <button onClick={() => setSettings(p => ({ ...p, useHourlyRate: false }))} className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase ${!settings.useHourlyRate ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-400'}`}>MENSUAL</button>
                <button onClick={() => setSettings(p => ({ ...p, useHourlyRate: true }))} className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase ${settings.useHourlyRate ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-400'}`}>POR HORA</button>
              </div>
            </div>
            <div className="flex-1">
              <label className="text-[8px] font-black text-slate-400 uppercase mb-1 block ml-1">Monto ($)</label>
              <input type="number" value={settings.useHourlyRate ? settings.hourlyRate : settings.monthlySalary} onChange={(e) => setSettings(p => ({ ...p, [settings.useHourlyRate ? 'hourlyRate' : 'monthlySalary']: Number(e.target.value) }))} className="w-full px-3 py-2 bg-white rounded-lg font-bold text-sm border-none focus:ring-1 focus:ring-blue-500" />
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-[10px] font-black text-slate-800 italic flex items-center gap-2 px-1 uppercase tracking-widest"><Wallet className="text-emerald-500 w-4 h-4" /> Adelantos Recibidos</h3>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-50 space-y-4 text-gray-800">
          <div className="flex gap-2">
            <input type="number" placeholder="$" className="w-24 px-3 py-3 bg-slate-50 rounded-xl font-bold text-sm outline-none focus:ring-1 focus:ring-emerald-500" value={newAdv.amt} onChange={(e) => setNewAdv({...newAdv, amt: e.target.value})} />
            <input type="text" placeholder="Concepto" className="flex-1 px-4 py-3 bg-slate-50 rounded-xl font-bold text-sm outline-none focus:ring-1 focus:ring-emerald-500" value={newAdv.note} onChange={(e) => setNewAdv({...newAdv, note: e.target.value})} />
            <button onClick={() => { if(newAdv.amt) onAddAdvance({ id: crypto.randomUUID(), date: new Date().toISOString(), amount: Number(newAdv.amt), note: newAdv.note }); setNewAdv({amt:'', note:''})}} className="bg-emerald-600 text-white px-4 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-emerald-900/10 active:scale-95">OK</button>
          </div>
          <div className="space-y-1.5">{advances.map(a => <div key={a.id} className="flex justify-between items-center px-4 py-3 bg-slate-50 rounded-xl text-xs border border-slate-100"><span className="font-bold text-slate-700">{formatCurrency(a.amount)} <span className="text-[9px] font-normal text-slate-400 italic ml-2">({a.note || 'S/N'})</span></span><button onClick={() => onDeleteAdvance(a.id)} className="text-red-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button></div>)}</div>
        </div>
      </section>

      <section className="p-4 flex flex-col gap-3">
        <div className="flex gap-2">
           <button onClick={() => { if(confirm('¿Borrar TODO?')) { localStorage.clear(); window.location.reload(); } }} className="flex-1 bg-red-50 text-red-600 py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all border border-red-100/50">
             <AlertCircle className="w-3 h-3" /> Reiniciar
           </button>
           <button onClick={() => { const data = localStorage.getItem('llavero_data'); if(data) { const blob = new Blob([data], {type: 'application/json'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'backup_registro.json'; a.click(); } }} className="flex-1 bg-blue-50 text-blue-600 py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all border border-blue-100/50">
             <Download className="w-3 h-3" /> Backup
           </button>
        </div>
        <div className="text-center space-y-1 opacity-20 py-8 border-t border-slate-100 mt-6">
           <p className="text-[8px] text-slate-600 font-black tracking-[0.3em] uppercase italic">Registro laboral v2.5 • Tu tiempo y tus ganancias, bajo tu control.</p>
           <p className="text-[7px] text-blue-600 font-black tracking-widest uppercase italic">Nexa Studio Professional</p>
        </div>
      </section>
    </div>
  );
};

const App: React.FC = () => {
  const [tab, setTab] = useState<'dash' | 'hist' | 'sett'>('dash');
  const [days, setDays] = useState<WorkDay[]>([]);
  const [advs, setAdvs] = useState<Advance[]>([]);
  const [settings, setSettings] = useState<UserSettings>({ 
    workerName: '', monthlySalary: DEFAULT_SALARY, hourlyRate: 150, useHourlyRate: false, 
    passwordHash: '1234', onboardingComplete: false, simplifiedMode: false,
    bpsRate: 22, extraMultiplier: 1.5, specialDayMultiplier: 2.0
  });

  useEffect(() => {
    const saved = localStorage.getItem('llavero_data');
    if (saved) { 
      try { 
        const p = JSON.parse(saved); 
        setDays(p.days || []); setAdvs(p.advs || []); setSettings(s => ({ ...s, ...p.settings })); 
      } catch (e) { console.error(e); } 
    }
  }, []);

  useEffect(() => { 
    localStorage.setItem('llavero_data', JSON.stringify({ days, advs, settings })); 
  }, [days, advs, settings]);

  if (!settings.onboardingComplete) return <Onboarding onComplete={(n) => setSettings(s => ({ ...s, workerName: n, onboardingComplete: true }))} />;

  return (
    <div className="min-h-screen pb-24 bg-slate-50 flex flex-col selection:bg-blue-100 selection:text-blue-900 font-inter">
      <header className="bg-white/90 backdrop-blur-2xl sticky top-0 z-50 border-b border-slate-100 px-5 py-4">
        <div className="max-w-xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-slate-900 p-1.5 rounded-xl text-white shadow-lg shadow-slate-200"><ShieldCheck className="w-4 h-4" /></div>
            <h1 className="text-lg font-black italic tracking-tighter text-slate-800 uppercase leading-none">Registro laboral</h1>
          </div>
          <div className="text-right">
            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 italic">Trabajador/a</p>
            <p className="text-[11px] font-black text-blue-600 max-w-[120px] truncate leading-none uppercase tracking-tighter">{settings.workerName}</p>
          </div>
        </div>
      </header>
      
      <main className="flex-1 max-w-xl mx-auto w-full px-5 py-6">
        {tab === 'dash' && <Dashboard workDays={days} settings={settings} advances={advs} onAction={(d) => setDays(p => { const ex = p.find(old => new Date(old.date).toDateString() === new Date(d.date).toDateString()); return ex ? p.map(o => o.id === ex.id ? d : o) : [d, ...p]; })} />}
        {tab === 'hist' && <History workDays={days} setWorkDays={setDays} settings={settings} />}
        {tab === 'sett' && <SettingsComp settings={settings} setSettings={setSettings} advances={advs} onAddAdvance={(a) => setAdvs(p => [...p, a])} onDeleteAdvance={(id) => setAdvs(p => p.filter(a => a.id !== id))} workDays={days} setWorkDays={setDays} />}
      </main>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-3xl px-12 py-4 rounded-full flex gap-14 items-center z-50 shadow-2xl shadow-slate-900/20 border border-white/5">
        <NavBtn act={tab === 'dash'} onClick={() => setTab('dash')} icon={<Clock />} lbl="Registro" />
        <NavBtn act={tab === 'hist'} onClick={() => setTab('hist')} icon={<HistoryIcon />} lbl="Libreta" />
        <NavBtn act={tab === 'sett'} onClick={() => setTab('sett')} icon={<SettingsIcon />} lbl="Ajustes" />
      </nav>
    </div>
  );
};

const NavBtn = ({ act, onClick, icon, lbl }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${act ? 'text-blue-400 scale-110' : 'text-slate-500 hover:text-white'}`}>
    {React.cloneElement(icon, { className: 'w-5 h-5' })}
    <span className="text-[7px] font-black uppercase tracking-[0.2em]">{lbl}</span>
  </button>
);

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<React.StrictMode><App /></React.StrictMode>);
