
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  Clock, History as HistoryIcon, Settings as SettingsIcon, FileText, Undo, 
  ShieldCheck, ArrowRight, Check, Plus, Minus, Play, Coffee, LogOut, 
  CheckCircle, AlertCircle, Download, Trash2, Edit2, Copy, Calendar, Save, 
  User, Wallet, Shield, RefreshCw, Upload, Smartphone, Share2, X, Lock,
  TrendingUp, BarChart3, ChevronRight, Info, Search
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
interface WorkDay {
  id: string;
  date: string;
  entryTime?: string;
  breakStartTime?: string;
  breakEndTime?: string;
  exitTime?: string;
  isHalfDay: boolean;
  status: 'incomplete' | 'complete';
  allowance: number; // Viáticos por día
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
  hourlyRate: number; // Por si prefiere calcular por hora directa
  useHourlyRate: boolean;
  passwordHash: string;
  onboardingComplete: boolean;
  simplifiedMode: boolean;
  bpsRate: number;
  extraMultiplier: number;
  specialDayMultiplier: number; // Domingos/Feriados
}

// --- UTILIDADES ---
const formatCurrency = (amount: number) => 
  new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);

const isHoliday = (date: Date) => 
  URUGUAY_HOLIDAYS.some(h => h.month === date.getMonth() && h.day === date.getDate());

const isSunday = (date: Date) => date.getDay() === 0;

const calculateDuration = (day: WorkDay): number => {
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
  let totalGross = 0, totalNormal = 0, totalExtra = 0, totalAllowances = 0;
  
  workDays.forEach(day => {
    const { gross, normalHours, extraHours } = getDayFinancials(day, settings);
    totalGross += gross;
    totalNormal += normalHours;
    totalExtra += extraHours;
    totalAllowances += (day.allowance || 0);
  });

  const bpsDiscount = totalGross * (settings.bpsRate / 100);
  const totalAdvances = advances.reduce((acc, curr) => acc + curr.amount, 0);
  const netPay = (totalGross - bpsDiscount - totalAdvances) + totalAllowances;
  
  return { totalGross, totalNormal, totalExtra, bpsDiscount, totalAdvances, totalAllowances, netPay };
};

// --- COMPONENTES ---

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-up border border-gray-100">
        <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <h3 className="font-black text-xl text-gray-800 tracking-tight">{title}</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><X className="w-6 h-6" /></button>
        </div>
        <div className="p-8">{children}</div>
      </div>
    </div>
  );
};

const Onboarding: React.FC<{ onComplete: (name: string) => void }> = ({ onComplete }) => {
  const [name, setName] = useState('');
  return (
    <div className="min-h-screen bg-blue-600 flex items-center justify-center p-6 text-white text-center">
      <div className="max-w-md w-full space-y-12 animate-fade-in">
        <div className="space-y-4">
          <div className="bg-white/10 w-28 h-28 rounded-[2.5rem] flex items-center justify-center mx-auto backdrop-blur-xl border border-white/20 shadow-2xl">
            <ShieldCheck className="w-14 h-14 text-white" />
          </div>
          <h1 className="text-5xl font-black italic tracking-tighter uppercase">LLAV</h1>
          <p className="text-blue-100 font-medium text-lg">Tu llavero digital para el trabajo.</p>
        </div>
        <div className="bg-white text-gray-900 p-10 rounded-[3rem] shadow-2xl space-y-8 text-left">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-800">¿Cómo te llamas?</h2>
            <p className="text-gray-400 text-sm">Usaremos tu nombre para personalizar tus recibos.</p>
          </div>
          <input type="text" placeholder="Ej: Juan Pérez" className="w-full px-6 py-5 rounded-3xl bg-gray-50 border-2 border-gray-100 focus:border-blue-500 outline-none font-bold text-xl transition-all" value={name} onChange={(e) => setName(e.target.value)} />
          <button disabled={!name.trim()} onClick={() => onComplete(name)} className="w-full bg-blue-600 text-white py-6 rounded-[2rem] font-black text-xl shadow-lg shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-3">
            EMPEZAR <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC<{ workDays: WorkDay[]; settings: UserSettings; advances: Advance[]; onAction: (day: WorkDay) => void }> = ({ workDays, settings, advances, onAction }) => {
  const summary = getSummary(workDays, settings, advances);
  const today = new Date();
  const todayStr = today.toDateString();
  const currentDay = workDays.find(d => new Date(d.date).toDateString() === todayStr) || { id: crypto.randomUUID(), date: today.toISOString(), isHalfDay: false, status: 'incomplete', allowance: 0 };

  const registerAction = () => {
    const now = new Date().toISOString();
    let updated: WorkDay = { ...currentDay };
    if (!updated.entryTime) updated.entryTime = now;
    else if (!settings.simplifiedMode && !updated.breakStartTime) updated.breakStartTime = now;
    else if (!settings.simplifiedMode && !updated.breakEndTime) updated.breakEndTime = now;
    else if (!updated.exitTime) { updated.exitTime = now; updated.status = 'complete'; }
    onAction(updated);
  };

  const getNextAction = () => {
    if (!currentDay.entryTime) return { label: 'MARCAR ENTRADA', icon: <Play className="fill-current" />, color: 'bg-blue-600' };
    if (!settings.simplifiedMode) {
      if (!currentDay.breakStartTime) return { label: 'INICIAR DESCANSO', icon: <Coffee />, color: 'bg-amber-500' };
      if (!currentDay.breakEndTime) return { label: 'FINALIZAR DESCANSO', icon: <Play />, color: 'bg-green-600' };
    }
    if (!currentDay.exitTime) return { label: 'MARCAR SALIDA', icon: <LogOut />, color: 'bg-red-600' };
    return { label: 'JORNADA COMPLETA', icon: <CheckCircle />, color: 'bg-gray-800' };
  };

  const action = getNextAction();
  const progress = (summary.totalNormal / HOURS_IN_MONTH) * 100;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-white rounded-[3rem] p-8 shadow-xl border border-gray-100 flex flex-col items-center text-center">
        <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-2">Sueldo Estimado</p>
        <h2 className="text-5xl font-black text-gray-900 mb-6">{formatCurrency(summary.netPay)}</h2>
        <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden mb-2">
          <div className="bg-blue-600 h-full transition-all duration-1000" style={{ width: `${Math.min(100, progress)}%` }}></div>
        </div>
        <p className="text-xs font-bold text-blue-600">{summary.totalNormal.toFixed(1)}h de {HOURS_IN_MONTH}h mensuales</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100">
          <TrendingUp className="text-blue-600 w-6 h-6 mb-2" />
          <p className="text-[10px] font-bold text-blue-400 uppercase">H. Extras</p>
          <p className="text-2xl font-black text-blue-700">{summary.totalExtra.toFixed(1)}h</p>
        </div>
        <div className="bg-green-50 p-6 rounded-[2rem] border border-green-100">
          <Wallet className="text-green-600 w-6 h-6 mb-2" />
          <p className="text-[10px] font-bold text-green-400 uppercase">Viáticos</p>
          <p className="text-2xl font-black text-green-700">{formatCurrency(summary.totalAllowances)}</p>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] p-10 shadow-2xl border border-gray-100 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-black text-gray-800 tracking-tight">Registro de Hoy</h3>
            <p className="text-gray-400 font-bold text-xs uppercase">{today.toLocaleDateString('es-UY', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>
          {(isSunday(today) || isHoliday(today)) && <span className="bg-amber-100 text-amber-700 text-[10px] px-3 py-1 rounded-full font-black italic">FERIADO/DOMINGO 2X</span>}
        </div>

        <button 
          disabled={currentDay.status === 'complete'} 
          onClick={registerAction} 
          className={`w-full ${action.color} text-white py-10 rounded-[2.5rem] font-black text-2xl shadow-xl active:scale-95 transition-all flex flex-col items-center gap-4 disabled:opacity-50 disabled:scale-100`}
        >
          {action.icon}
          {action.label}
        </button>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <TimeDisplay label="Entrada" time={currentDay.entryTime} />
          {!settings.simplifiedMode && <>
            <TimeDisplay label="D. Inicio" time={currentDay.breakStartTime} />
            <TimeDisplay label="D. Fin" time={currentDay.breakEndTime} />
          </>}
          <TimeDisplay label="Salida" time={currentDay.exitTime} />
        </div>
      </div>
    </div>
  );
};

const TimeDisplay = ({ label, time }: { label: string, time?: string }) => (
  <div className="bg-gray-50 p-4 rounded-[1.5rem] text-center border border-gray-100">
    <span className="block text-[9px] font-black text-gray-400 uppercase mb-1">{label}</span>
    <span className="text-base font-black text-gray-700">{time ? new Date(time).toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
  </div>
);

const History: React.FC<{ workDays: WorkDay[]; setWorkDays: React.Dispatch<React.SetStateAction<WorkDay[]>>; settings: UserSettings }> = ({ workDays, setWorkDays, settings }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDay, setEditingDay] = useState<Partial<WorkDay> | null>(null);
  const [filter, setFilter] = useState('');

  const sortedDays = useMemo(() => {
    return [...workDays]
      .filter(d => d.date.includes(filter))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [workDays, filter]);

  const getTimeValue = (iso?: string) => iso ? new Date(iso).toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit', hour12: false }) : '';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-3xl font-black text-gray-800 italic">HISTORIAL</h2>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="month" 
            className="w-full pl-12 pr-4 py-3 bg-white rounded-2xl border border-gray-100 focus:ring-2 ring-blue-500 font-bold text-sm"
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <button onClick={() => { setEditingDay({ id: crypto.randomUUID(), date: new Date().toISOString().split('T')[0], status: 'complete', isHalfDay: false, allowance: 0 }); setIsModalOpen(true); }} className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase shadow-lg shadow-blue-100 flex items-center gap-2">
          <Plus className="w-5 h-5" /> AGREGAR
        </button>
      </div>

      <div className="space-y-4">
        {sortedDays.map(day => {
          const fin = getDayFinancials(day, settings);
          return (
            <div key={day.id} className={`bg-white rounded-[2rem] p-6 shadow-sm border-l-[12px] flex justify-between items-center transition-all hover:shadow-md ${fin.isSpecial ? 'border-amber-400' : 'border-blue-600'}`}>
              <div className="flex gap-4 items-center">
                <div className="bg-gray-50 rounded-2xl p-3 text-center min-w-[60px]">
                  <span className="block text-[10px] font-black text-gray-400 uppercase">{new Date(day.date).toLocaleDateString('es-UY', { weekday: 'short' })}</span>
                  <span className="block text-xl font-black text-gray-800">{new Date(day.date).getDate()}</span>
                </div>
                <div>
                  <p className="font-black text-gray-800 text-lg uppercase tracking-tight">{new Date(day.date).toLocaleDateString('es-UY', { month: 'short', year: 'numeric' })}</p>
                  <p className="text-xs font-bold text-gray-400">{getTimeValue(day.entryTime)} — {getTimeValue(day.exitTime)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-blue-600 tracking-tighter">{fin.duration.toFixed(1)}h</p>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => { setEditingDay(day); setIsModalOpen(true); }} className="text-gray-300 hover:text-blue-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => { if(confirm('¿Eliminar?')) setWorkDays(p => p.filter(d => d.id !== day.id)); }} className="text-gray-300 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Editar Jornada">
        <form onSubmit={(e) => { e.preventDefault(); setWorkDays(p => p.some(d => d.id === editingDay!.id) ? p.map(d => d.id === editingDay!.id ? editingDay as WorkDay : d) : [editingDay as WorkDay, ...p]); setIsModalOpen(false); }} className="space-y-6">
          <div><label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">Fecha</label><input type="date" required className="w-full px-6 py-4 bg-gray-50 rounded-2xl font-bold" value={editingDay?.date?.split('T')[0] || ''} onChange={(e) => setEditingDay({ ...editingDay, date: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">Entrada</label><input type="time" required className="w-full px-6 py-4 bg-gray-50 rounded-2xl font-bold" value={getTimeValue(editingDay?.entryTime)} onChange={(e) => setEditingDay({ ...editingDay, entryTime: `${editingDay?.date?.split('T')[0]}T${e.target.value}:00` })} /></div>
            <div><label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">Salida</label><input type="time" required className="w-full px-6 py-4 bg-gray-50 rounded-2xl font-bold" value={getTimeValue(editingDay?.exitTime)} onChange={(e) => setEditingDay({ ...editingDay, exitTime: `${editingDay?.date?.split('T')[0]}T${e.target.value}:00` })} /></div>
          </div>
          <div><label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">Viáticos ($)</label><input type="number" className="w-full px-6 py-4 bg-gray-50 rounded-2xl font-bold" value={editingDay?.allowance || ''} onChange={(e) => setEditingDay({ ...editingDay, allowance: Number(e.target.value) })} /></div>
          <button type="submit" className="w-full bg-blue-600 text-white py-6 rounded-[2rem] font-black text-xl shadow-xl hover:bg-blue-700">GUARDAR CAMBIOS</button>
        </form>
      </Modal>
    </div>
  );
};

const SettingsComp: React.FC<{ settings: UserSettings; setSettings: React.Dispatch<React.SetStateAction<UserSettings>>; advances: Advance[]; onAddAdvance: (a: Advance) => void; onDeleteAdvance: (id: string) => void }> = ({ settings, setSettings, advances, onAddAdvance, onDeleteAdvance }) => {
  const [isAuth, setIsAuth] = useState(false);
  const [pass, setPass] = useState('');
  const [newAdv, setNewAdv] = useState({ amt: '', note: '' });

  if (!isAuth) return (
    <div className="py-20 px-6 flex flex-col items-center justify-center animate-fade-in">
      <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl w-full max-w-md border border-gray-100 text-center space-y-8">
        <div className="bg-blue-50 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto"><Lock className="w-12 h-12 text-blue-600" /></div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-gray-800 italic">ÁREA PRIVADA</h2>
          <p className="text-gray-400 font-medium">Introduce tu contraseña de acceso.</p>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); if (pass === settings.passwordHash) setIsAuth(true); else alert('Pass incorrecta (Default: 1234)'); }} className="space-y-4">
          <input type="password" placeholder="Pass (Default: 1234)" className="w-full px-6 py-6 rounded-3xl border-2 border-gray-50 text-center text-2xl font-black tracking-widest focus:border-blue-500 outline-none transition-all" value={pass} onChange={(e) => setPass(e.target.value)} autoFocus />
          <button className="w-full bg-blue-600 text-white py-6 rounded-[2rem] font-black text-xl shadow-xl shadow-blue-100 active:scale-95 transition-all">DESBLOQUEAR</button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      <section className="space-y-4">
        <h3 className="text-xl font-black text-gray-800 italic flex items-center gap-2 px-2"><User className="text-blue-600" /> PERFIL Y SALARIO</h3>
        <div className="bg-white p-8 rounded-[3rem] shadow-xl space-y-6 border border-gray-50">
          <div><label className="text-[10px] font-black text-gray-400 uppercase mb-2 block ml-2">Nombre</label><input type="text" value={settings.workerName} onChange={(e) => setSettings(p => ({ ...p, workerName: e.target.value }))} className="w-full px-6 py-4 bg-gray-50 rounded-2xl font-bold outline-none focus:ring-2 ring-blue-500 transition-all" /></div>
          <div className="flex items-center gap-4 bg-gray-50 p-6 rounded-[2rem]">
            <div className="flex-1">
              <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Cálculo por:</p>
              <div className="flex gap-2">
                <button onClick={() => setSettings(p => ({ ...p, useHourlyRate: false }))} className={`flex-1 py-3 rounded-xl font-black text-xs ${!settings.useHourlyRate ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-400'}`}>MENSUAL</button>
                <button onClick={() => setSettings(p => ({ ...p, useHourlyRate: true }))} className={`flex-1 py-3 rounded-xl font-black text-xs ${settings.useHourlyRate ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-400'}`}>POR HORA</button>
              </div>
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Monto ($)</label>
              <input type="number" value={settings.useHourlyRate ? settings.hourlyRate : settings.monthlySalary} onChange={(e) => setSettings(p => ({ ...p, [settings.useHourlyRate ? 'hourlyRate' : 'monthlySalary']: Number(e.target.value) }))} className="w-full px-4 py-3 bg-white rounded-xl font-black" />
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-xl font-black text-gray-800 italic flex items-center gap-2 px-2"><TrendingUp className="text-amber-500" /> PARÁMETROS LEGALES</h3>
        <div className="bg-white p-8 rounded-[3rem] shadow-xl space-y-6 border border-gray-50">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-[10px] font-black text-gray-400 uppercase mb-2 block ml-2">Descuento BPS (%)</label><input type="number" value={settings.bpsRate} onChange={(e) => setSettings(p => ({ ...p, bpsRate: Number(e.target.value) }))} className="w-full px-6 py-4 bg-gray-50 rounded-2xl font-bold" /></div>
            <div><label className="text-[10px] font-black text-gray-400 uppercase mb-2 block ml-2">Extra (1.5x / 2x)</label><input type="number" value={settings.extraMultiplier} onChange={(e) => setSettings(p => ({ ...p, extraMultiplier: Number(e.target.value) }))} className="w-full px-6 py-4 bg-gray-50 rounded-2xl font-bold" /></div>
          </div>
          <div><label className="text-[10px] font-black text-gray-400 uppercase mb-2 block ml-2">Domingo/Feriado (Normal x Multiplicador)</label><input type="number" value={settings.specialDayMultiplier} onChange={(e) => setSettings(p => ({ ...p, specialDayMultiplier: Number(e.target.value) }))} className="w-full px-6 py-4 bg-gray-50 rounded-2xl font-bold" /></div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-xl font-black text-gray-800 italic flex items-center gap-2 px-2"><Wallet className="text-green-600" /> ADELANTOS</h3>
        <div className="bg-white p-8 rounded-[3rem] shadow-xl space-y-6 border border-gray-50">
          <div className="flex gap-2">
            <input type="number" placeholder="$ Monto" className="flex-1 px-6 py-4 bg-gray-50 rounded-2xl font-bold" value={newAdv.amt} onChange={(e) => setNewAdv({...newAdv, amt: e.target.value})} />
            <input type="text" placeholder="Nota" className="flex-1 px-6 py-4 bg-gray-50 rounded-2xl font-bold" value={newAdv.note} onChange={(e) => setNewAdv({...newAdv, note: e.target.value})} />
            <button onClick={() => { if(newAdv.amt) onAddAdvance({ id: crypto.randomUUID(), date: new Date().toISOString(), amount: Number(newAdv.amt), note: newAdv.note }); setNewAdv({amt:'', note:''})}} className="bg-green-600 text-white px-8 rounded-2xl font-black">OK</button>
          </div>
          <div className="space-y-2">{advances.map(a => <div key={a.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl"><span className="font-black text-gray-700">{formatCurrency(a.amount)} ({a.note || 'S/N'})</span><button onClick={() => onDeleteAdvance(a.id)} className="text-red-500"><Trash2 className="w-5 h-5" /></button></div>)}</div>
        </div>
      </section>

      <section className="p-4 flex flex-col gap-4">
        <button onClick={() => { if(confirm('¿Borrar todo?')) { localStorage.clear(); window.location.reload(); } }} className="w-full bg-red-50 text-red-600 py-6 rounded-[2rem] font-black flex items-center justify-center gap-3 active:scale-95 transition-all">
          <AlertCircle className="w-6 h-6" /> REINICIAR TODA LA APP
        </button>
        <p className="text-center text-[10px] text-gray-300 font-black tracking-widest uppercase italic">Llavero Digital (LlaV) v100 • Uruguay Edition</p>
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
    <div className="min-h-screen pb-32 bg-gray-50 flex flex-col selection:bg-blue-100 selection:text-blue-900">
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 px-6 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-200"><ShieldCheck className="w-6 h-6" /></div>
            <h1 className="text-2xl font-black italic tracking-tighter text-gray-800 uppercase">LLAV</h1>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">TRABAJADOR</p>
            <p className="text-sm font-black text-blue-600">{settings.workerName}</p>
          </div>
        </div>
      </header>
      
      <main className="flex-1 max-w-4xl mx-auto w-full p-6">
        {tab === 'dash' && <Dashboard workDays={days} settings={settings} advances={advs} onAction={(d) => setDays(p => { const ex = p.find(old => new Date(old.date).toDateString() === new Date(d.date).toDateString()); return ex ? p.map(o => o.id === ex.id ? d : o) : [d, ...p]; })} />}
        {tab === 'hist' && <History workDays={days} setWorkDays={setDays} settings={settings} />}
        {tab === 'sett' && <SettingsComp settings={settings} setSettings={setSettings} advances={advs} onAddAdvance={(a) => setAdvs(p => [...p, a])} onDeleteAdvance={(id) => setAdvs(p => p.filter(a => a.id !== id))} />}
      </main>

      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-900/90 backdrop-blur-xl px-10 py-5 rounded-[2.5rem] flex gap-12 items-center z-50 shadow-2xl border border-white/10">
        <NavBtn act={tab === 'dash'} onClick={() => setTab('dash')} icon={<Clock />} lbl="Tablero" />
        <NavBtn act={tab === 'hist'} onClick={() => setTab('hist')} icon={<HistoryIcon />} lbl="Historial" />
        <NavBtn act={tab === 'sett'} onClick={() => setTab('sett')} icon={<SettingsIcon />} lbl="Ajustes" />
      </nav>
    </div>
  );
};

const NavBtn = ({ act, onClick, icon, lbl }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all ${act ? 'text-blue-400 scale-110' : 'text-gray-400 hover:text-white'}`}>
    {React.cloneElement(icon, { className: 'w-7 h-7' })}
    <span className="text-[9px] font-black uppercase tracking-widest">{lbl}</span>
  </button>
);

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<React.StrictMode><App /></React.StrictMode>);
