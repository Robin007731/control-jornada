
import React, { useMemo, useState } from 'react';
import { Download, Trash2, Edit2, Copy, AlertCircle, Calendar, Plus, Save, Clock, ChevronDown } from 'lucide-react';
import { WorkDay } from '../types';
import { calculateDuration, isHoliday, isSunday } from '../utils';
import Modal from './Modal';

interface HistoryProps {
  workDays: WorkDay[];
  setWorkDays: React.Dispatch<React.SetStateAction<WorkDay[]>>;
  onExport: () => void;
}

const History: React.FC<HistoryProps> = ({ workDays, setWorkDays, onExport }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDay, setEditingDay] = useState<Partial<WorkDay> | null>(null);
  const [showQuickMenu, setShowQuickMenu] = useState(false);

  const sortedDays = useMemo(() => {
    return [...workDays].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [workDays]);

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este registro?')) {
      setWorkDays(prev => prev.filter(d => d.id !== id));
    }
  };

  const handleDuplicate = (day: WorkDay) => {
    const newDay: WorkDay = {
      ...day,
      id: crypto.randomUUID(),
      date: new Date().toISOString()
    };
    setWorkDays(prev => [newDay, ...prev]);
  };

  const openManualEntry = (preset?: 'FULL' | 'HALF' | 'ENTRY' | 'BREAK' | 'EXIT' | 'NONE', day?: WorkDay) => {
    setShowQuickMenu(false);
    const today = new Date().toISOString().split('T')[0];
    
    if (day) {
      setEditingDay(day);
    } else {
      let base: Partial<WorkDay> = {
        id: crypto.randomUUID(),
        date: today,
        isManual: true,
        status: 'complete',
        isHalfDay: false,
        allowance: 0
      };

      // Aplicar preajustes
      switch (preset) {
        case 'FULL':
          base.entryTime = `${today}T08:00:00`;
          base.breakStartTime = `${today}T12:00:00`;
          base.breakEndTime = `${today}T13:00:00`;
          base.exitTime = `${today}T17:00:00`;
          break;
        case 'HALF':
          base.entryTime = `${today}T08:00:00`;
          base.exitTime = `${today}T12:00:00`;
          base.isHalfDay = true;
          // Sin descanso como pidió el usuario
          break;
        case 'ENTRY':
          base.entryTime = `${today}T08:00:00`;
          base.status = 'incomplete';
          break;
        case 'BREAK':
          base.entryTime = `${today}T08:00:00`;
          base.breakStartTime = `${today}T12:00:00`;
          base.status = 'incomplete';
          break;
        case 'EXIT':
          base.entryTime = `${today}T08:00:00`;
          base.exitTime = `${today}T17:00:00`;
          break;
      }
      
      setEditingDay(base);
    }
    setIsModalOpen(true);
  };

  const saveManualEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDay || !editingDay.date) return;

    const finalDay = {
        ...editingDay,
        status: (editingDay.entryTime && editingDay.exitTime) ? 'complete' : 'incomplete'
    } as WorkDay;

    setWorkDays(prev => {
      const exists = prev.find(d => d.id === finalDay.id);
      if (exists) {
        return prev.map(d => d.id === finalDay.id ? finalDay : d);
      }
      return [finalDay, ...prev];
    });
    setIsModalOpen(false);
    setEditingDay(null);
  };

  const handleTimeChange = (field: keyof WorkDay, time: string) => {
    if (!editingDay || !editingDay.date) return;
    const datePart = editingDay.date.split('T')[0];
    const newDateTime = time ? `${datePart}T${time}:00` : undefined;
    setEditingDay(prev => ({ ...prev, [field]: newDateTime }));
  };

  const getTimeValue = (isoString?: string) => {
    if (!isoString) return '';
    try {
        return new Date(isoString).toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch(e) { return ''; }
  };

  const missingDays = useMemo(() => {
    if (workDays.length === 0) return [];
    const missing: Date[] = [];
    const now = new Date();
    const start = new Date(now);
    start.setMonth(now.getMonth() - 1);

    for (let d = new Date(start); d <= now; d.setDate(d.getDate() + 1)) {
      if (isSunday(d) || isHoliday(d)) continue;
      const exists = workDays.some(wd => new Date(wd.date).toDateString() === d.toDateString());
      if (!exists) {
        missing.push(new Date(d));
      }
    }
    return missing.reverse();
  }, [workDays]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Historial</h2>
        <div className="flex gap-2 relative">
          <div className="relative">
            <button 
              onClick={() => setShowQuickMenu(!showQuickMenu)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-md active:scale-95"
            >
              <Plus className="w-4 h-4" /> Nuevo <ChevronDown className={`w-3 h-3 transition-transform ${showQuickMenu ? 'rotate-180' : ''}`} />
            </button>
            
            {showQuickMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[60] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-2 space-y-1">
                  <QuickOption onClick={() => openManualEntry('FULL')} label="Jornada Completa" sub="08:00 - 17:00" color="text-blue-600" />
                  <QuickOption onClick={() => openManualEntry('HALF')} label="Medio Turno" sub="Sin descanso" color="text-green-600" />
                  <QuickOption onClick={() => openManualEntry('ENTRY')} label="Solo Entrada" sub="Punto de inicio" color="text-gray-600" />
                  <QuickOption onClick={() => openManualEntry('BREAK')} label="A Descanso" sub="Registrar pausa" color="text-amber-600" />
                  <QuickOption onClick={() => openManualEntry('EXIT')} label="Salida" sub="Cerrar jornada" color="text-red-600" />
                  <div className="border-t border-gray-50 my-1"></div>
                  <QuickOption onClick={() => openManualEntry('NONE')} label="Manual / Vacío" sub="Personalizar todo" color="text-gray-400" />
                </div>
              </div>
            )}
          </div>
          
          <button 
            onClick={onExport}
            className="flex items-center justify-center p-2 bg-gray-100 text-gray-500 rounded-xl hover:bg-gray-200 transition-colors"
            title="Exportar CSV"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Backdrop for Quick Menu */}
      {showQuickMenu && <div className="fixed inset-0 z-50" onClick={() => setShowQuickMenu(false)}></div>}

      {missingDays.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
          <h4 className="text-red-800 font-bold text-sm flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4" /> Días laborables sin registro
          </h4>
          <div className="flex flex-wrap gap-2">
            {missingDays.slice(0, 5).map(date => (
              <span 
                key={date.toISOString()} 
                onClick={() => {
                  setEditingDay({
                    id: crypto.randomUUID(),
                    date: date.toISOString().split('T')[0],
                    status: 'complete',
                    isHalfDay: false,
                    isManual: true,
                    allowance: 0
                  });
                  setIsModalOpen(true);
                }}
                className="bg-red-200 text-red-800 text-[10px] font-bold px-2 py-1 rounded-full cursor-pointer hover:bg-red-300 transition-colors"
              >
                {date.toLocaleDateString('es-UY', { day: '2-digit', month: 'short' })}
              </span>
            ))}
            {missingDays.length > 5 && <span className="text-red-600 text-[10px] font-bold">+{missingDays.length - 5} más</span>}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {sortedDays.map(day => {
          const dur = calculateDuration(day);
          const extra = Math.max(0, dur - 8);
          const dateObj = new Date(day.date);
          const holiday = isHoliday(dateObj);
          
          return (
            <div 
              key={day.id}
              className={`bg-white rounded-2xl p-4 shadow-sm border-l-4 transition-all hover:shadow-md ${
                day.status === 'incomplete' ? 'border-red-400' : holiday ? 'border-amber-400' : 'border-blue-400'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex gap-4 items-center">
                  <div className="text-center bg-gray-50 rounded-xl p-2 min-w-[50px]">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase">{dateObj.toLocaleDateString('es-UY', { weekday: 'short' })}</span>
                    <span className="block text-lg font-bold text-gray-700">{dateObj.getDate()}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-800">{dateObj.toLocaleDateString('es-UY', { month: 'long', year: 'numeric' })}</span>
                      {holiday && <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Feriado</span>}
                      {day.isManual && <span className="text-gray-300" title="Registro Manual"><Edit2 className="w-3 h-3" /></span>}
                    </div>
                    <div className="text-xs text-gray-500 flex gap-2 mt-1">
                      <span>{day.entryTime ? new Date(day.entryTime).toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                      <span>→</span>
                      <span>{day.exitTime ? new Date(day.exitTime).toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-lg font-bold text-blue-600">{dur.toFixed(1)} <span className="text-xs">h</span></div>
                  {extra > 0 && <div className="text-xs font-bold text-red-500">+{extra.toFixed(1)} extra</div>}
                  {day.isHalfDay && <div className="text-[9px] font-black text-green-600 uppercase">Medio Turno</div>}
                  {day.allowance && day.allowance > 0 ? <div className="text-[9px] font-black text-emerald-600 uppercase">Viáticos: ${day.allowance}</div> : null}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end gap-2">
                <button onClick={() => handleDuplicate(day)} className="p-2 text-gray-300 hover:text-blue-500 transition-colors" title="Duplicar">
                  <Copy className="w-4 h-4" />
                </button>
                <button onClick={() => openManualEntry('NONE', day)} className="p-2 text-gray-300 hover:text-blue-500 transition-colors" title="Editar">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(day.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors" title="Eliminar">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {workDays.length === 0 && (
          <div className="text-center py-12 px-6">
            <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <h3 className="text-gray-400 font-semibold">No hay registros aún</h3>
            <p className="text-gray-300 text-sm">Empieza a marcar tu jornada desde el tablero principal o añade uno manual.</p>
          </div>
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingDay?.id && workDays.some(d => d.id === editingDay.id) ? "Editar Registro" : "Nuevo Registro Manual"}
      >
        <form onSubmit={saveManualEntry} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Fecha de la Jornada</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input 
                type="date" 
                required
                className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium border-none text-gray-800"
                value={editingDay?.date?.split('T')[0] || ''}
                onChange={(e) => setEditingDay({ ...editingDay, date: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Hora Entrada</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input 
                  type="time" 
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium border-none text-gray-800"
                  value={getTimeValue(editingDay?.entryTime)}
                  onChange={(e) => handleTimeChange('entryTime', e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Hora Salida</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input 
                  type="time" 
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium border-none text-gray-800"
                  value={getTimeValue(editingDay?.exitTime)}
                  onChange={(e) => handleTimeChange('exitTime', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
            <h4 className="text-[10px] font-bold text-blue-400 uppercase mb-3">Descansos (Opcional)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <input 
                  type="time" 
                  className="w-full px-4 py-2 bg-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm border-none text-gray-800"
                  value={getTimeValue(editingDay?.breakStartTime)}
                  onChange={(e) => handleTimeChange('breakStartTime', e.target.value)}
                />
                <span className="text-[9px] text-blue-300 mt-1 block">Inicio Descanso</span>
              </div>
              <div>
                <input 
                  type="time" 
                  className="w-full px-4 py-2 bg-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm border-none text-gray-800"
                  value={getTimeValue(editingDay?.breakEndTime)}
                  onChange={(e) => handleTimeChange('breakEndTime', e.target.value)}
                />
                <span className="text-[9px] text-blue-300 mt-1 block">Fin Descanso</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
               <input 
                  type="checkbox" 
                  id="halfday"
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  checked={editingDay?.isHalfDay || false}
                  onChange={(e) => setEditingDay({ ...editingDay, isHalfDay: e.target.checked })}
               />
               <label htmlFor="halfday" className="text-sm font-medium text-gray-700">Marcar como medio turno (sin descanso)</label>
            </div>

            <div className="bg-gray-50 p-3 rounded-xl">
              <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Viáticos ($)</label>
              <input 
                type="number" 
                className="w-full px-4 py-2 bg-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm border-none text-gray-800 font-bold"
                placeholder="0"
                value={editingDay?.allowance || ''}
                onChange={(e) => setEditingDay({ ...editingDay, allowance: Number(e.target.value) })}
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg active:scale-95 mt-4"
          >
            <Save className="w-5 h-5" /> Guardar Registro
          </button>
        </form>
      </Modal>
    </div>
  );
};

const QuickOption = ({ onClick, label, sub, color }: { onClick: () => void, label: string, sub: string, color: string }) => (
  <button 
    onClick={onClick}
    className="w-full flex flex-col items-start p-3 rounded-xl hover:bg-gray-50 transition-colors text-left group"
  >
    <span className={`text-xs font-bold uppercase tracking-tight ${color}`}>{label}</span>
    <span className="text-[10px] text-gray-400 group-hover:text-gray-500">{sub}</span>
  </button>
);

export default History;
