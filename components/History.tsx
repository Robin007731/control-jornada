
import React, { useMemo, useState } from 'react';
import { Download, Trash2, Edit2, Copy, AlertCircle, Calendar, Plus, Save, Clock, ChevronDown, ListPlus, CalendarDays, CheckCircle2, Moon } from 'lucide-react';
import { WorkDay } from '../types';
import { calculateDuration, isHoliday, isSunday } from '../utils';
import Modal from './Modal';

interface HistoryProps {
  workDays: WorkDay[];
  setWorkDays: React.Dispatch<React.SetStateAction<WorkDay[]>>;
  onExport: () => void;
}

const WEEKDAYS = [
  { label: 'L', value: 1, full: 'Lunes' },
  { label: 'M', value: 2, full: 'Martes' },
  { label: 'M', value: 3, full: 'Miércoles' },
  { label: 'J', value: 4, full: 'Jueves' },
  { label: 'V', value: 5, full: 'Viernes' },
  { label: 'S', value: 6, full: 'Sábado' },
  { label: 'D', value: 0, full: 'Domingo' },
];

const History: React.FC<HistoryProps> = ({ workDays, setWorkDays, onExport }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingDay, setEditingDay] = useState<Partial<WorkDay> | null>(null);
  const [showQuickMenu, setShowQuickMenu] = useState(false);

  // Bulk entry state
  const [bulkStartDate, setBulkStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [bulkEndDate, setBulkEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [bulkSelectedDays, setBulkSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [bulkEntryTime, setBulkEntryTime] = useState('08:00');
  const [bulkExitTime, setBulkExitTime] = useState('17:00');
  const [bulkBreakStart, setBulkBreakStart] = useState('12:00');
  const [bulkBreakEnd, setBulkBreakEnd] = useState('13:00');
  const [bulkAllowance, setBulkAllowance] = useState(0);

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

  const handleBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const start = new Date(bulkStartDate + 'T00:00:00');
    const end = new Date(bulkEndDate + 'T00:00:00');
    const newDays: WorkDay[] = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      if (bulkSelectedDays.includes(dayOfWeek)) {
        const dateStr = d.toISOString().split('T')[0];
        const alreadyExists = workDays.some(wd => wd.date.startsWith(dateStr));
        if (alreadyExists) continue;

        newDays.push({
          id: crypto.randomUUID(),
          date: dateStr,
          entryTime: `${dateStr}T${bulkEntryTime}:00`,
          breakStartTime: bulkBreakStart ? `${dateStr}T${bulkBreakStart}:00` : undefined,
          breakEndTime: bulkBreakEnd ? `${dateStr}T${bulkBreakEnd}:00` : undefined,
          exitTime: `${dateStr}T${bulkExitTime}:00`,
          isHalfDay: false,
          isManual: true,
          isDayOff: false,
          status: 'complete',
          allowance: bulkAllowance || 0
        });
      }
    }

    if (newDays.length > 0) {
      setWorkDays(prev => [...newDays, ...prev]);
      setIsBulkModalOpen(false);
      alert(`Se han añadido ${newDays.length} jornadas correctamente.`);
    } else {
      alert("No se añadieron días. Verifica el rango o si ya existen registros en esas fechas.");
    }
  };

  const openManualEntry = (preset?: 'FULL' | 'HALF' | 'ENTRY' | 'BREAK' | 'EXIT' | 'NONE' | 'LIBRE', day?: WorkDay) => {
    setShowQuickMenu(false);
    const today = new Date().toISOString().split('T')[0];
    
    if (day) {
      setEditingDay(day);
    } else {
      let base: Partial<WorkDay> = {
        id: crypto.randomUUID(),
        date: today,
        isManual: true,
        isDayOff: false,
        status: 'complete',
        isHalfDay: false,
        allowance: 0
      };

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
          break;
        case 'LIBRE':
          base.isDayOff = true;
          base.status = 'complete';
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
        status: editingDay.isDayOff ? 'complete' : ((editingDay.entryTime && editingDay.exitTime) ? 'complete' : 'incomplete')
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

  const toggleBulkDay = (val: number) => {
    setBulkSelectedDays(prev => 
      prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
    );
  };

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
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[60] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-2 space-y-1">
                  <div className="px-3 py-2 text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-gray-50 mb-1">Opciones rápidas</div>
                  <QuickOption onClick={() => openManualEntry('FULL')} label="Jornada Completa" sub="08:00 - 17:00" color="text-blue-600" />
                  <QuickOption onClick={() => openManualEntry('HALF')} label="Medio Turno" sub="Sin descanso" color="text-green-600" />
                  <QuickOption onClick={() => openManualEntry('LIBRE')} label="Día Libre" sub="Hoy no se trabaja" color="text-slate-500" icon={<Moon className="w-3.5 h-3.5" />} />
                  <div className="border-t border-gray-50 my-1"></div>
                  <div className="px-3 py-2 text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-gray-50 mb-1">Herramientas</div>
                  <QuickOption 
                    onClick={() => { setShowQuickMenu(false); setIsBulkModalOpen(true); }} 
                    label="Relleno Masivo" 
                    sub="Cargar rango de fechas" 
                    color="text-indigo-600" 
                    icon={<ListPlus className="w-3.5 h-3.5" />}
                  />
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
                    isDayOff: false,
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
                day.isDayOff ? 'border-slate-300 opacity-80' : day.status === 'incomplete' ? 'border-red-400' : holiday ? 'border-amber-400' : 'border-blue-400'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex gap-4 items-center">
                  <div className={`text-center rounded-xl p-2 min-w-[50px] ${day.isDayOff ? 'bg-slate-100' : 'bg-gray-50'}`}>
                    <span className="block text-[10px] font-bold text-gray-400 uppercase">{dateObj.toLocaleDateString('es-UY', { weekday: 'short' })}</span>
                    <span className="block text-lg font-bold text-gray-700">{dateObj.getDate()}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-800">{dateObj.toLocaleDateString('es-UY', { month: 'long', year: 'numeric' })}</span>
                      {holiday && <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Feriado</span>}
                      {day.isDayOff && <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><Moon className="w-2 h-2" /> Libre</span>}
                      {day.isManual && <span className="text-gray-300" title="Registro Manual"><Edit2 className="w-3 h-3" /></span>}
                    </div>
                    {!day.isDayOff ? (
                      <div className="text-xs text-gray-500 flex gap-2 mt-1">
                        <span>{day.entryTime ? new Date(day.entryTime).toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                        <span>→</span>
                        <span>{day.exitTime ? new Date(day.exitTime).toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                      </div>
                    ) : (
                      <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tight">Sin actividad laboral</div>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  {!day.isDayOff ? (
                    <>
                      <div className="text-lg font-bold text-blue-600">{dur.toFixed(1)} <span className="text-xs">h</span></div>
                      {extra > 0 && <div className="text-xs font-bold text-red-500">+{extra.toFixed(1)} extra</div>}
                      {day.isHalfDay && <div className="text-[9px] font-black text-green-600 uppercase">Medio Turno</div>}
                      {day.allowance && day.allowance > 0 ? <div className="text-[9px] font-black text-emerald-600 uppercase">Viáticos: ${day.allowance}</div> : null}
                    </>
                  ) : (
                    <div className="text-slate-300 font-bold">0.0 h</div>
                  )}
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

      {/* Modal Carga Masiva */}
      <Modal 
        isOpen={isBulkModalOpen} 
        onClose={() => setIsBulkModalOpen(false)} 
        title="Relleno Masivo de Jornadas"
      >
        <form onSubmit={handleBulkSubmit} className="space-y-4">
          <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 space-y-4">
            <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-widest mb-2">
              <CalendarDays className="w-4 h-4" /> Configuración de Rango
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] font-black uppercase text-indigo-400 mb-1 block">Desde</label>
                <input 
                  type="date" 
                  className="w-full px-3 py-2 rounded-xl bg-white border-none outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold"
                  value={bulkStartDate}
                  onChange={(e) => setBulkStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-indigo-400 mb-1 block">Hasta</label>
                <input 
                  type="date" 
                  className="w-full px-3 py-2 rounded-xl bg-white border-none outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold"
                  value={bulkEndDate}
                  onChange={(e) => setBulkEndDate(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-[9px] font-black uppercase text-indigo-400 mb-2 block">Días de la semana que trabajas</label>
              <div className="flex justify-between">
                {WEEKDAYS.map(day => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleBulkDay(day.value)}
                    className={`w-9 h-9 rounded-full font-black text-xs flex items-center justify-center transition-all ${
                      bulkSelectedDays.includes(day.value) 
                      ? 'bg-indigo-600 text-white shadow-lg scale-110' 
                      : 'bg-white text-indigo-300 border border-indigo-100'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Hora Entrada</label>
              <input 
                type="time" 
                className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium border-none text-gray-800"
                value={bulkEntryTime}
                onChange={(e) => setBulkEntryTime(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Hora Salida</label>
              <input 
                type="time" 
                className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium border-none text-gray-800"
                value={bulkExitTime}
                onChange={(e) => setBulkExitTime(e.target.value)}
              />
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
            <h4 className="text-[10px] font-bold text-blue-400 uppercase mb-3">Descanso Aplicado</h4>
            <div className="grid grid-cols-2 gap-4">
              <input 
                type="time" 
                className="w-full px-4 py-2 bg-white rounded-lg outline-none text-sm border-none text-gray-800"
                value={bulkBreakStart}
                onChange={(e) => setBulkBreakStart(e.target.value)}
              />
              <input 
                type="time" 
                className="w-full px-4 py-2 bg-white rounded-lg outline-none text-sm border-none text-gray-800"
                value={bulkBreakEnd}
                onChange={(e) => setBulkBreakEnd(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-xl">
            <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Viáticos por día ($)</label>
            <input 
              type="number" 
              className="w-full px-4 py-2 bg-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm border-none text-gray-800 font-bold"
              placeholder="0"
              value={bulkAllowance || ''}
              onChange={(e) => setBulkAllowance(Number(e.target.value))}
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg active:scale-95 mt-4"
          >
            <CheckCircle2 className="w-5 h-5" /> Generar Jornadas
          </button>
        </form>
      </Modal>

      {/* Modal Registro Individual */}
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

          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-all">
            <input 
              type="checkbox" 
              id="isdayoff"
              className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
              checked={editingDay?.isDayOff || false}
              onChange={(e) => setEditingDay({ ...editingDay, isDayOff: e.target.checked })}
            />
            <label htmlFor="isdayoff" className="text-sm font-black uppercase tracking-tight text-slate-700 flex items-center gap-2">
              <Moon className="w-4 h-4 text-slate-400" /> ¿Es día libre?
            </label>
          </div>

          {!editingDay?.isDayOff && (
            <>
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
            </>
          )}

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

const QuickOption = ({ onClick, label, sub, color, icon }: { onClick: () => void, label: string, sub: string, color: string, icon?: React.ReactNode }) => (
  <button 
    onClick={onClick}
    className="w-full flex flex-col items-start p-3 rounded-xl hover:bg-gray-50 transition-colors text-left group"
  >
    <div className="flex items-center gap-2">
      <span className={`text-xs font-bold uppercase tracking-tight ${color}`}>{label}</span>
      {icon && <span className={color}>{icon}</span>}
    </div>
    <span className="text-[10px] text-gray-400 group-hover:text-gray-500">{sub}</span>
  </button>
);

export default History;
