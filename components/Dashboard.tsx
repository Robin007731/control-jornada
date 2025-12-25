
import React, { useState, useEffect } from 'react';
import { Plus, Play, Coffee, LogOut, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { WorkDay, UserSettings, Advance } from '../types';
import { getSummary, formatCurrency, isHoliday } from '../utils';

interface DashboardProps {
  workDays: WorkDay[];
  settings: UserSettings;
  advances: Advance[];
  onAction: (day: WorkDay) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ workDays, settings, advances, onAction }) => {
  const [currentDay, setCurrentDay] = useState<WorkDay | null>(null);
  
  useEffect(() => {
    const todayStr = new Date().toDateString();
    const todayData = workDays.find(d => new Date(d.date).toDateString() === todayStr);
    if (todayData) {
      setCurrentDay(todayData);
    } else {
      setCurrentDay({
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        isHalfDay: false,
        isManual: false,
        status: 'incomplete',
        allowance: 0
      });
    }
  }, [workDays]);

  const summary = getSummary(workDays, settings, advances);

  const registerAction = () => {
    if (!currentDay) return;
    const now = new Date().toISOString();
    let updated: WorkDay = { ...currentDay };

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
      status: 'complete',
      allowance: currentDay.allowance || 0
    };
    onAction(updated);
  };

  const getNextAction = () => {
    if (!currentDay?.entryTime) return { label: 'Entrada', icon: <Play /> };
    if (!settings.simplifiedMode) {
      if (!currentDay.breakStartTime) return { label: 'Descanso (Inicio)', icon: <Coffee /> };
      if (!currentDay.breakEndTime) return { label: 'Descanso (Fin)', icon: <Coffee /> };
    }
    if (!currentDay.exitTime) return { label: 'Salida Final', icon: <LogOut /> };
    return { label: 'Jornada Completa', icon: <CheckCircle /> };
  };

  const nextAction = getNextAction();
  const isDone = currentDay?.status === 'complete';
  const todayHoliday = isHoliday(new Date());

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col gap-1">
          <p className="text-blue-100 text-sm font-medium">Líquido estimado a cobrar</p>
          <h2 className="text-3xl font-bold">{formatCurrency(summary.netPay)}</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 border-t border-white/20 pt-4">
            <div>
              <p className="text-xs text-blue-100 uppercase tracking-wider">Horas Normales</p>
              <p className="font-semibold">{summary.totalNormalHours.toFixed(1)} h</p>
            </div>
            <div>
              <p className="text-xs text-blue-100 uppercase tracking-wider">Horas Extra</p>
              <p className="font-semibold text-amber-300">{summary.totalExtraHours.toFixed(1)} h</p>
            </div>
          </div>
        </div>
        <div className="absolute -right-10 -bottom-10 opacity-20 transform rotate-12">
          <Clock className="w-48 h-48" />
        </div>
      </div>

      {/* Main Action Area */}
      <div className="bg-white rounded-3xl p-6 shadow-md border border-gray-100">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-lg font-bold">Registro del Día</h3>
            <p className="text-gray-500 text-sm">
              {new Date().toLocaleDateString('es-UY', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          {todayHoliday && (
            <span className="bg-amber-100 text-amber-700 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Feriado
            </span>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <button 
            disabled={isDone}
            onClick={registerAction}
            className={`flex items-center justify-center gap-3 py-6 px-4 rounded-2xl font-bold text-xl shadow-lg transition-all active:scale-95 ${
              isDone 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {nextAction.icon}
            {nextAction.label}
          </button>

          {!isDone && !currentDay?.entryTime && (
            <button 
              onClick={registerHalfDay}
              className="flex items-center justify-center gap-2 py-4 px-4 rounded-2xl font-semibold text-green-700 bg-green-50 border-2 border-green-200 hover:bg-green-100 transition-all active:scale-95"
            >
              Medio Turno (E -> S)
            </button>
          )}

          {currentDay?.entryTime && (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <TimeBadge label="Entrada" time={currentDay.entryTime} />
              {!settings.simplifiedMode && (
                <>
                  <TimeBadge label="D. Inicio" time={currentDay.breakStartTime} />
                  <TimeBadge label="D. Fin" time={currentDay.breakEndTime} />
                </>
              )}
              <TimeBadge label="Salida" time={currentDay.exitTime} />
            </div>
          )}
        </div>
      </div>

      {/* Advancements Alert if any */}
      {summary.totalAdvances > 0 && (
        <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-xl flex items-center gap-3">
          <AlertCircle className="text-orange-600 w-5 h-5 flex-shrink-0" />
          <div className="text-sm text-orange-800">
            Tienes <span className="font-bold">{formatCurrency(summary.totalAdvances)}</span> en adelantos que serán descontados.
          </div>
        </div>
      )}
    </div>
  );
};

const TimeBadge = ({ label, time }: { label: string, time?: string }) => (
  <div className="bg-gray-50 p-2 rounded-xl text-center border border-gray-100">
    <span className="block text-[10px] uppercase text-gray-400 font-bold mb-1">{label}</span>
    <span className="text-sm font-semibold text-gray-700">
      {time ? new Date(time).toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
    </span>
  </div>
);

export default Dashboard;
