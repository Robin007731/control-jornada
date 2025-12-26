
import React, { useState, useEffect } from 'react';
import { 
  Play, Coffee, LogOut, CheckCircle, AlertCircle, Clock, 
  Moon, Sparkles, Coffee as RelaxIcon, Timer, 
  Calendar as CalIcon, Briefcase, HeartPulse, Palmtree
} from 'lucide-react';
import { WorkDay, UserSettings, Advance, DayType } from '../types';
import { getSummary, formatCurrency, isHoliday, getLocalDateString, calculateDuration } from '../utils';
import Modal from './Modal';

interface DashboardProps {
  workDays: WorkDay[];
  settings: UserSettings;
  advances: Advance[];
  onAction: (day: WorkDay) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ workDays, settings, advances, onAction }) => {
  const [currentDay, setCurrentDay] = useState<WorkDay | null>(null);
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  
  useEffect(() => {
    const todayStr = getLocalDateString();
    const todayData = workDays.find(d => d.date === todayStr);
    if (todayData) {
      setCurrentDay(todayData);
    } else {
      setCurrentDay({
        id: crypto.randomUUID(),
        date: todayStr,
        type: 'work',
        isHalfDay: false,
        isManual: false,
        status: 'incomplete',
        allowance: 0
      });
    }
  }, [workDays]);

  if (!currentDay) return null;

  const summary = getSummary(workDays, settings, advances);
  const netHoursToday = calculateDuration(currentDay);
  
  // Progreso mensual (Asumiendo 22 días laborables como meta)
  const workProgress = Math.min(100, (workDays.filter(d => d.type === 'work' && d.status === 'complete').length / 22) * 100);

  const registerAction = () => {
    const now = new Date().toISOString();
    let updated: WorkDay = { ...currentDay, type: 'work' };

    if (!updated.entryTime) {
      updated.entryTime = now;
    } else if (!settings.simplifiedMode && !updated.breakStartTime) {
      updated.breakStartTime = now;
    } else if (!settings.simplifiedMode && !updated.breakEndTime) {
      updated.breakEndTime = now;
    } else if (!updated.exitTime) {
      updated.exitTime = now;
      updated.status = 'complete';
    }

    onAction(updated);
  };

  const setDayType = (type: DayType) => {
    const updated: WorkDay = {
      ...currentDay,
      type,
      entryTime: undefined,
      breakStartTime: undefined,
      breakEndTime: undefined,
      exitTime: undefined,
      status: 'complete',
      allowance: 0
    };
    onAction(updated);
    setIsTypeModalOpen(false);
  };

  const getNextAction = () => {
    if (currentDay.type !== 'work') return { label: 'Día Especial', icon: <CalIcon /> };
    if (!currentDay.entryTime) return { label: 'Iniciar Jornada', icon: <Play /> };
    if (!settings.simplifiedMode) {
      if (!currentDay.breakStartTime) return { label: 'Tomar Descanso', icon: <Coffee /> };
      if (!currentDay.breakEndTime) return { label: 'Fin de Descanso', icon: <Coffee /> };
    }
    if (!currentDay.exitTime) return { label: 'Finalizar Salida', icon: <LogOut /> };
    return { label: 'Jornada Cerrada', icon: <CheckCircle /> };
  };

  const nextAction = getNextAction();
  const isDone = currentDay.status === 'complete' && currentDay.type === 'work' && !!currentDay.exitTime;
  const isSpecialDay = currentDay.type !== 'work';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Tarjeta de Ganancias VIP */}
      <div className="bg-slate-900 rounded-[3rem] p-8 text-white shadow-[0_25px_60px_-15px_rgba(15,23,42,0.5)] relative overflow-hidden border border-white/5">
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-6">
            <span className="bg-blue-600/20 text-blue-400 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border border-blue-500/20 italic">
              Balance Mensual Estimado
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Live Sync</span>
            </div>
          </div>
          
          <h2 className="text-5xl font-black tracking-tighter italic mb-8">{formatCurrency(summary.netPay)}</h2>
          
          <div className="space-y-4">
             <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-500">
               <span>Progreso de Jornadas</span>
               <span>{Math.round(workProgress)}%</span>
             </div>
             <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
               <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-1000" style={{ width: `${workProgress}%` }}></div>
             </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-white/5">
            <StatSmall label="Horas" value={`${summary.totalNormalHours.toFixed(1)}h`} />
            <StatSmall label="Extras" value={`+${summary.totalExtraHours.toFixed(1)}h`} color="text-blue-400" />
            <StatSmall label="Viáticos" value={formatCurrency(summary.totalAllowances)} color="text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Control Pro de Jornada */}
      <div className="bg-white rounded-[3rem] p-8 shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-8">
           <div className="flex items-center gap-4">
              <div className="bg-slate-50 p-3 rounded-2xl">
                 <CalIcon className="w-6 h-6 text-slate-400" />
              </div>
              <div>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Hoy</p>
                 <p className="text-base font-black text-slate-800 uppercase italic leading-none">
                    {new Date().toLocaleDateString('es-UY', { weekday: 'long', day: 'numeric', month: 'long' })}
                 </p>
              </div>
           </div>
           <button 
             onClick={() => setIsTypeModalOpen(true)}
             className="bg-slate-900 text-white p-2.5 rounded-2xl shadow-lg active:scale-90 transition-all"
           >
              <Briefcase className="w-5 h-5" />
           </button>
        </div>

        <div className="flex flex-col gap-5">
          {isSpecialDay ? (
             <SpecialDayCard type={currentDay.type} onReset={() => onAction({...currentDay, type: 'work', status: 'incomplete'})} />
          ) : (
            <>
              <button 
                disabled={isDone}
                onClick={registerAction}
                className={`flex items-center justify-center gap-4 py-8 rounded-[2rem] font-black text-2xl italic uppercase tracking-tighter shadow-xl transition-all active:scale-95 ${
                  isDone 
                  ? 'bg-slate-100 text-slate-300 shadow-none' 
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/30'
                }`}
              >
                {React.cloneElement(nextAction.icon as React.ReactElement<any>, { className: 'w-7 h-7' })}
                {nextAction.label}
              </button>

              {currentDay.entryTime && (
                <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
                   <div className="flex justify-between items-center bg-slate-50 p-5 rounded-[2rem] border border-slate-100">
                      <div className="flex items-center gap-3">
                         <Timer className="w-5 h-5 text-blue-600" />
                         <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Cálculo de Horas Netas</span>
                      </div>
                      <span className="text-2xl font-black italic text-slate-900">{netHoursToday.toFixed(2)}h</span>
                   </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <TimeBadge label="Entrada" time={currentDay.entryTime} active={true} />
                    {!settings.simplifiedMode && (
                      <>
                        <TimeBadge label="D. Inicio" time={currentDay.breakStartTime} active={!!currentDay.breakStartTime} color="amber" />
                        <TimeBadge label="D. Fin" time={currentDay.breakEndTime} active={!!currentDay.breakEndTime} color="amber" />
                      </>
                    )}
                    <TimeBadge label="Salida" time={currentDay.exitTime} active={!!currentDay.exitTime} />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal Tipo de Jornada */}
      <Modal 
        isOpen={isTypeModalOpen} 
        onClose={() => setIsTypeModalOpen(false)} 
        title="Tipo de Jornada"
      >
        <div className="grid grid-cols-1 gap-4">
           <TypeOption 
             onClick={() => setDayType('work')} 
             label="Trabajo Normal" 
             sub="Registro horario activo" 
             icon={<Briefcase />} 
             color="bg-blue-600" 
           />
           <TypeOption 
             onClick={() => setDayType('off')} 
             label="Descanso / Libre" 
             sub="Día no laborable" 
             icon={<Moon />} 
             color="bg-slate-900" 
           />
           <TypeOption 
             onClick={() => setDayType('vacation')} 
             label="Licencia Ordinaria" 
             sub="Vacaciones pagas" 
             icon={<Palmtree />} 
             color="bg-emerald-600" 
           />
           <TypeOption 
             onClick={() => setDayType('medical')} 
             label="Licencia Médica" 
             sub="Justificado por BPS/Mutual" 
             icon={<HeartPulse />} 
             color="bg-rose-600" 
           />
        </div>
      </Modal>
    </div>
  );
};

const StatSmall = ({ label, value, color = "text-white" }: { label: string, value: string, color?: string }) => (
  <div className="space-y-1">
    <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest leading-none">{label}</p>
    <p className={`font-black text-sm uppercase italic ${color}`}>{value}</p>
  </div>
);

const TimeBadge = ({ label, time, active, color = 'blue' }: { label: string, time?: string, active: boolean, color?: 'blue' | 'amber' }) => {
  const bgColor = active ? (color === 'blue' ? 'bg-blue-50 border-blue-100' : 'bg-amber-50 border-amber-100') : 'bg-slate-50 border-slate-100 opacity-40';
  const labelColor = active ? (color === 'blue' ? 'text-blue-400' : 'text-amber-500') : 'text-slate-400';
  const timeColor = active ? (color === 'blue' ? 'text-slate-900' : 'text-amber-900') : 'text-slate-400';

  return (
    <div className={`p-4 rounded-2xl text-center border transition-all ${bgColor}`}>
      <span className={`block text-[8px] uppercase font-black mb-1.5 tracking-widest ${labelColor}`}>{label}</span>
      <span className={`text-xs font-black italic ${timeColor}`}>
        {time ? new Date(time).toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit', hour12: false }) : '--:--'}
      </span>
    </div>
  );
};

const SpecialDayCard = ({ type, onReset }: { type: DayType, onReset: () => void }) => {
  const configs = {
    off: { label: 'Día Libre', icon: <Moon />, color: 'text-blue-500', bg: 'bg-blue-50' },
    vacation: { label: 'Vacaciones', icon: <Palmtree />, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    medical: { label: 'Licencia Médica', icon: <HeartPulse />, color: 'text-rose-500', bg: 'bg-rose-50' },
    work: { label: '', icon: null, color: '', bg: '' }
  };
  const config = configs[type as keyof typeof configs];

  return (
    <div className={`${config.bg} border-2 border-dashed border-slate-200 py-12 rounded-[2.5rem] flex flex-col items-center justify-center gap-5 text-center px-6 animate-in zoom-in duration-500`}>
      <div className={`bg-white p-6 rounded-full shadow-xl ${config.color} scale-125`}>
        {React.cloneElement(config.icon as React.ReactElement<any>, { className: 'w-10 h-10' })}
      </div>
      <div className="space-y-2">
        <h4 className="font-black uppercase tracking-widest text-lg text-slate-800 italic">Hoy: {config.label}</h4>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sin registros horarios necesarios</p>
      </div>
      <button onClick={onReset} className="mt-4 text-[9px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest underline transition-colors">Volver a modo trabajo</button>
    </div>
  );
};

const TypeOption = ({ onClick, label, sub, icon, color }: { onClick: () => void, label: string, sub: string, icon: React.ReactNode, color: string }) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center gap-4 p-5 rounded-3xl bg-slate-50 hover:bg-white hover:shadow-xl hover:border-blue-100 border border-transparent transition-all group text-left"
  >
    <div className={`${color} p-3 rounded-2xl text-white shadow-lg transition-transform group-hover:scale-110`}>
      {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-6 h-6' })}
    </div>
    <div>
      <p className="font-black text-sm text-slate-900 uppercase italic tracking-tight">{label}</p>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{sub}</p>
    </div>
  </button>
);

export default Dashboard;
