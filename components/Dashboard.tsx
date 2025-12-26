
import React, { useState, useEffect } from 'react';
import { Play, Coffee, LogOut, CheckCircle, AlertCircle, Clock, Moon, Sparkles, Coffee as RelaxIcon } from 'lucide-react';
import { WorkDay, UserSettings, Advance } from '../types';
import { getSummary, formatCurrency, isHoliday, getLocalDateString } from '../utils';

interface DashboardProps {
  workDays: WorkDay[];
  settings: UserSettings;
  advances: Advance[];
  onAction: (day: WorkDay) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ workDays, settings, advances, onAction }) => {
  const [currentDay, setCurrentDay] = useState<WorkDay | null>(null);
  
  useEffect(() => {
    const todayStr = getLocalDateString();
    const todayData = workDays.find(d => d.date === todayStr);
    if (todayData) {
      setCurrentDay(todayData);
    } else {
      setCurrentDay({
        id: crypto.randomUUID(),
        date: todayStr,
        isHalfDay: false,
        isManual: false,
        isDayOff: false,
        status: 'incomplete',
        allowance: 0
      });
    }
  }, [workDays]);

  const summary = getSummary(workDays, settings, advances);

  const registerAction = () => {
    if (!currentDay) return;
    const now = new Date().toISOString();
    let updated: WorkDay = { ...currentDay, isDayOff: false };

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

  const registerHalfDay = () => {
    if (!currentDay) return;
    const now = new Date().toISOString();
    const updated: WorkDay = {
      ...currentDay,
      entryTime: currentDay.entryTime || now,
      exitTime: now,
      isHalfDay: true,
      isDayOff: false,
      status: 'complete',
      allowance: currentDay.allowance || 0
    };
    onAction(updated);
  };

  const registerDayOff = () => {
    if (!currentDay) return;
    if (confirm("¿Marcar hoy como día libre? Esto bloqueará el registro de hoy.")) {
      const updated: WorkDay = {
        ...currentDay,
        entryTime: undefined,
        breakStartTime: undefined,
        breakEndTime: undefined,
        exitTime: undefined,
        isHalfDay: false,
        isDayOff: true,
        status: 'complete',
        allowance: 0
      };
      onAction(updated);
    }
  };

  const getNextAction = () => {
    if (currentDay?.isDayOff) return { label: 'Día Libre', icon: <Moon /> };
    if (!currentDay?.entryTime) return { label: 'Entrada', icon: <Play /> };
    if (!settings.simplifiedMode) {
      if (!currentDay.breakStartTime) return { label: 'Descanso (I)', icon: <Coffee /> };
      if (!currentDay.breakEndTime) return { label: 'Descanso (F)', icon: <Coffee /> };
    }
    if (!currentDay.exitTime) return { label: 'Salida Final', icon: <LogOut /> };
    return { label: 'Jornada Completa', icon: <CheckCircle /> };
  };

  const nextAction = getNextAction();
  const isDone = currentDay?.status === 'complete' || currentDay?.isDayOff;
  const todayHoliday = isHoliday(getLocalDateString());

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Resumen de Ganancias */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] italic">Líquido Estimado</p>
          <h2 className="text-4xl font-black tracking-tighter italic">{formatCurrency(summary.netPay)}</h2>
          <div className="mt-6 flex gap-6 border-t border-white/5 pt-6">
            <div className="space-y-1">
              <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Normales</p>
              <p className="font-black text-sm">{summary.totalNormalHours.toFixed(1)}h</p>
            </div>
            <div className="space-y-1">
              <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Extras</p>
              <p className="font-black text-sm text-amber-400">+{summary.totalExtraHours.toFixed(1)}h</p>
            </div>
            <div className="space-y-1 ml-auto text-right">
              <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Viáticos</p>
              <p className="font-black text-sm text-emerald-400">{formatCurrency(summary.totalAllowances)}</p>
            </div>
          </div>
        </div>
        <div className="absolute -right-8 -bottom-8 opacity-5 transform rotate-12">
          <Clock className="w-48 h-48" />
        </div>
      </div>

      {/* Control de Jornada */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-1 italic">Control de Hoy</h3>
            <p className="text-xl font-black text-slate-800 capitalize leading-none">
              {new Date().toLocaleDateString('es-UY', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          {todayHoliday && !currentDay?.isDayOff && (
            <span className="bg-amber-100 text-amber-700 text-[9px] px-3 py-1.5 rounded-full font-black uppercase tracking-widest flex items-center gap-1 border border-amber-200">
              <AlertCircle className="w-3 h-3" /> Feriado
            </span>
          )}
        </div>

        <div className="flex flex-col gap-4">
          {currentDay?.isDayOff ? (
            <div className="bg-slate-50 border-2 border-dashed border-blue-100 py-12 rounded-3xl flex flex-col items-center justify-center gap-4 text-slate-400 relative overflow-hidden group">
              <div className="bg-white p-5 rounded-full shadow-inner text-blue-500 relative z-10 scale-110">
                <RelaxIcon className="w-12 h-12 animate-bounce duration-[4000ms]" />
              </div>
              <div className="text-center space-y-2 relative z-10 px-4">
                <p className="font-black uppercase tracking-[0.2em] text-[12px] text-slate-800">¡Hoy es tu día libre!</p>
                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4" /> Disfruta tu descanso <Sparkles className="w-4 h-4" />
                </p>
              </div>
              <button 
                onClick={() => onAction({...currentDay, isDayOff: false, status: 'incomplete'})}
                className="mt-6 text-[9px] font-black text-slate-400 underline uppercase tracking-[0.2em] hover:text-blue-600 transition-all relative z-10"
              >
                ¿Cambio de planes? Volver a modo trabajo
              </button>
              <div className="absolute inset-0 bg-blue-50/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <button 
                disabled={isDone}
                onClick={registerAction}
                className={`group flex items-center justify-center gap-4 py-8 px-6 rounded-3xl font-black text-xl italic uppercase tracking-tighter shadow-xl transition-all active:scale-95 ${
                  isDone 
                  ? 'bg-slate-50 text-slate-300 cursor-not-allowed shadow-none border-2 border-slate-100' 
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20'
                }`}
              >
                {React.cloneElement(nextAction.icon as React.ReactElement<any>, { className: 'w-6 h-6' })}
                {nextAction.label}
              </button>

              {!isDone && !currentDay?.entryTime && (
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={registerHalfDay}
                    className="flex items-center justify-center gap-2 py-5 px-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-emerald-700 bg-emerald-50 border-2 border-emerald-100 hover:bg-emerald-100 transition-all active:scale-95"
                  >
                    Medio Turno
                  </button>
                  <button 
                    onClick={registerDayOff}
                    className="flex items-center justify-center gap-2 py-5 px-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-blue-700 bg-blue-50 border-2 border-blue-100 hover:bg-blue-100 transition-all active:scale-95 shadow-sm"
                  >
                    <Moon className="w-3.5 h-3.5" /> Día Libre
                  </button>
                </div>
              )}
            </div>
          )}

          {currentDay?.entryTime && !currentDay?.isDayOff && (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <TimeBadge label="Entrada" time={currentDay.entryTime} active={true} />
              {!settings.simplifiedMode && (
                <>
                  <TimeBadge label="D. Inicio" time={currentDay.breakStartTime} active={!!currentDay.breakStartTime} />
                  <TimeBadge label="D. Fin" time={currentDay.breakEndTime} active={!!currentDay.breakEndTime} />
                </>
              )}
              <TimeBadge label="Salida" time={currentDay.exitTime} active={!!currentDay.exitTime} />
            </div>
          )}
        </div>
      </div>

      {summary.totalAdvances > 0 && (
        <div className="bg-amber-50 border border-amber-100 p-5 rounded-3xl flex items-center gap-4 animate-slide-up">
          <div className="bg-amber-100 p-2 rounded-xl text-amber-600"><AlertCircle className="w-5 h-5" /></div>
          <div className="text-[10px] font-bold text-amber-800 leading-relaxed uppercase tracking-widest">
            Hay <span className="font-black text-amber-950 underline">{formatCurrency(summary.totalAdvances)}</span> en adelantos que se descontarán del reporte.
          </div>
        </div>
      )}
    </div>
  );
};

const TimeBadge = ({ label, time, active }: { label: string, time?: string, active: boolean }) => (
  <div className={`p-3 rounded-2xl text-center border transition-all ${active ? 'bg-blue-50 border-blue-100 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-40'}`}>
    <span className={`block text-[8px] uppercase font-black mb-1 tracking-widest ${active ? 'text-blue-400' : 'text-slate-400'}`}>{label}</span>
    <span className={`text-xs font-black italic ${active ? 'text-blue-900' : 'text-slate-400'}`}>
      {time ? new Date(time).toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit', hour12: false }) : '--:--'}
    </span>
  </div>
);

export default Dashboard;
