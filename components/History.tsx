
import React, { useMemo, useState } from 'react';
import { 
  Download, Trash2, Edit2, Copy, Plus, Save, Clock, ChevronDown, 
  ListPlus, CalendarDays, CheckCircle2, Moon, Coffee, HeartPulse, Palmtree, Briefcase 
} from 'lucide-react';
import { WorkDay, DayType } from '../types';
import { calculateDuration, isHoliday, isSunday, getLocalDateString } from '../utils';
import Modal from './Modal';

interface HistoryProps {
  workDays: WorkDay[];
  setWorkDays: React.Dispatch<React.SetStateAction<WorkDay[]>>;
  onExport: () => void;
}

const WEEKDAYS = [
  { label: 'L', value: 1 }, { label: 'M', value: 2 }, { label: 'M', value: 3 }, 
  { label: 'J', value: 4 }, { label: 'V', value: 5 }, { label: 'S', value: 6 }, { label: 'D', value: 0 },
];

const History: React.FC<HistoryProps> = ({ workDays, setWorkDays, onExport }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDay, setEditingDay] = useState<Partial<WorkDay> | null>(null);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);

  const sortedDays = useMemo(() => {
    return [...workDays].sort((a, b) => b.date.localeCompare(a.date));
  }, [workDays]);

  const handleDuplicate = (day: WorkDay) => {
    const newDay: WorkDay = { ...day, id: crypto.randomUUID(), date: getLocalDateString() };
    setWorkDays(prev => [newDay, ...prev]);
  };

  const openManualEntry = (preset?: 'FULL' | 'NONE' | 'LIBRE', day?: WorkDay) => {
    setShowQuickMenu(false);
    const today = getLocalDateString();
    
    if (day) {
      setEditingDay(day);
    } else {
      let base: Partial<WorkDay> = {
        id: crypto.randomUUID(),
        date: today,
        type: 'work',
        isManual: true,
        status: 'complete',
        isHalfDay: false,
        allowance: 0
      };

      if (preset === 'FULL') {
        base.entryTime = `${today}T08:00:00`;
        base.breakStartTime = `${today}T12:00:00`;
        base.breakEndTime = `${today}T12:30:00`;
        base.exitTime = `${today}T16:30:00`;
      } else if (preset === 'LIBRE') {
        base.type = 'off';
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
        status: editingDay.type !== 'work' ? 'complete' : ((editingDay.entryTime && editingDay.exitTime) ? 'complete' : 'incomplete')
    } as WorkDay;

    setWorkDays(prev => {
      const exists = prev.find(d => d.id === finalDay.id);
      if (exists) return prev.map(d => d.id === finalDay.id ? finalDay : d);
      return [finalDay, ...prev];
    });
    setIsModalOpen(false);
    setEditingDay(null);
  };

  const getTimeValue = (isoString?: string) => {
    if (!isoString) return '';
    try {
        const d = new Date(isoString);
        return d.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch(e) { return ''; }
  };

  const handleTimeChange = (field: keyof WorkDay, time: string) => {
    if (!editingDay?.date) return;
    const newDateTime = time ? `${editingDay.date}T${time}:00` : undefined;
    setEditingDay(prev => ({ ...prev, [field]: newDateTime }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-2">
        <h2 className="text-2xl font-black italic uppercase tracking-tighter">Historial</h2>
        <div className="flex gap-3 relative">
          <button 
            onClick={() => setShowQuickMenu(!showQuickMenu)}
            className="flex items-center gap-2 px-6 py-3.5 bg-blue-600 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest shadow-xl active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" /> Agregar <ChevronDown className="w-3 h-3" />
          </button>
          <button onClick={onExport} className="bg-slate-100 p-3.5 rounded-2xl text-slate-400 hover:text-slate-900 transition-all"><Download className="w-5 h-5" /></button>
          
          {showQuickMenu && (
            <div className="absolute right-0 top-16 w-60 bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-50 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
               <div className="p-2 space-y-1">
                 <QuickItem onClick={() => openManualEntry('FULL')} label="Jornada 8h Netas" sub="08:00 a 16:30" icon={<Briefcase />} color="text-blue-600" />
                 <QuickItem onClick={() => openManualEntry('LIBRE')} label="Día Libre" sub="Sin trabajo" icon={<Moon />} color="text-slate-400" />
                 <QuickItem onClick={() => openManualEntry('NONE')} label="Entrada Manual" sub="Carga personalizada" icon={<Edit2 />} color="text-indigo-400" />
               </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {sortedDays.map(day => {
          const dur = calculateDuration(day);
          const extra = Math.max(0, dur - 8);
          const dateObj = new Date(day.date + 'T00:00:00');
          const isSpec = day.type !== 'work';
          
          return (
            <div key={day.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex justify-between items-center transition-all hover:shadow-xl hover:scale-[1.01] group">
              <div className="flex items-center gap-5">
                 <div className="text-center bg-slate-50 p-3 rounded-2xl min-w-[60px]">
                    <p className="text-[9px] font-black text-slate-300 uppercase leading-none mb-1">{dateObj.toLocaleDateString('es-UY', { weekday: 'short' })}</p>
                    <p className="text-xl font-black text-slate-800 leading-none italic">{dateObj.getDate()}</p>
                 </div>
                 <div>
                    <div className="flex items-center gap-2 mb-1">
                       <p className="font-black text-sm text-slate-900 uppercase italic tracking-tight">{dateObj.toLocaleDateString('es-UY', { month: 'short', year: 'numeric' })}</p>
                       <StatusLabel type={day.type} />
                    </div>
                    {!isSpec ? (
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {getTimeValue(day.entryTime)} → {getTimeValue(day.exitTime)} 
                        {day.breakStartTime && <span className="text-amber-500 ml-2">(Descanso)</span>}
                      </p>
                    ) : (
                      <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">Jornada no computable</p>
                    )}
                 </div>
              </div>

              <div className="flex items-center gap-6">
                 {!isSpec && (
                   <div className="text-right">
                      <p className="text-lg font-black italic text-slate-900 leading-none">{dur.toFixed(1)}h</p>
                      {extra > 0 && <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mt-1">+{extra.toFixed(1)} Extra</p>}
                   </div>
                 )}
                 <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openManualEntry('NONE', day)} className="p-2 text-slate-300 hover:text-blue-600"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteConfirmationId(day.id)} className="p-2 text-slate-300 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
                 </div>
              </div>
            </div>
          );
        })}
      </div>

      <Modal isOpen={!!deleteConfirmationId} onClose={() => setDeleteConfirmationId(null)} title="Eliminar Registro">
         <div className="text-center space-y-6">
            <div className="bg-rose-50 w-20 h-20 rounded-[2.5rem] flex items-center justify-center mx-auto text-rose-500 shadow-inner">
               <Trash2 className="w-10 h-10" />
            </div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] leading-relaxed">¿Deseas eliminar permanentemente esta jornada del historial local?</p>
            <button 
              onClick={() => { setWorkDays(prev => prev.filter(d => d.id !== deleteConfirmationId)); setDeleteConfirmationId(null); }} 
              className="w-full bg-rose-600 text-white py-5 rounded-[1.5rem] font-black uppercase text-xs shadow-xl active:scale-95"
            >
              Confirmar Eliminación
            </button>
         </div>
      </Modal>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Detalle de Jornada">
         <form onSubmit={saveManualEntry} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-2">Fecha</label>
                  <input type="date" value={editingDay?.date || ''} onChange={e => setEditingDay({...editingDay!, date: e.target.value})} className="w-full p-4 rounded-2xl bg-slate-50 font-bold text-sm outline-none shadow-inner" />
               </div>
               <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-2">Tipo</label>
                  <select value={editingDay?.type} onChange={e => setEditingDay({...editingDay!, type: e.target.value as DayType})} className="w-full p-4 rounded-2xl bg-slate-50 font-bold text-sm outline-none shadow-inner">
                     <option value="work">Trabajo</option>
                     <option value="off">Libre</option>
                     <option value="vacation">Vacaciones</option>
                     <option value="medical">Médico</option>
                  </select>
               </div>
            </div>

            {editingDay?.type === 'work' && (
              <div className="space-y-5 animate-in fade-in zoom-in duration-300">
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-2 italic">Entrada</label>
                       <input type="time" value={getTimeValue(editingDay.entryTime)} onChange={e => handleTimeChange('entryTime', e.target.value)} className="w-full p-4 rounded-2xl bg-slate-50 font-bold text-sm outline-none shadow-inner" />
                    </div>
                    <div>
                       <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-2 italic">Salida</label>
                       <input type="time" value={getTimeValue(editingDay.exitTime)} onChange={e => handleTimeChange('exitTime', e.target.value)} className="w-full p-4 rounded-2xl bg-slate-50 font-bold text-sm outline-none shadow-inner" />
                    </div>
                 </div>
                 <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-2"><Coffee className="w-3 h-3" /> Intervalo de Descanso</p>
                    <div className="grid grid-cols-2 gap-4">
                       <input type="time" value={getTimeValue(editingDay.breakStartTime)} onChange={e => handleTimeChange('breakStartTime', e.target.value)} className="w-full p-3 rounded-xl bg-white font-bold text-xs outline-none shadow-sm" />
                       <input type="time" value={getTimeValue(editingDay.breakEndTime)} onChange={e => handleTimeChange('breakEndTime', e.target.value)} className="w-full p-3 rounded-xl bg-white font-bold text-xs outline-none shadow-sm" />
                    </div>
                 </div>
                 <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-2">Viáticos Adicionales ($)</label>
                    <input type="number" value={editingDay.allowance} onChange={e => setEditingDay({...editingDay, allowance: Number(e.target.value)})} className="w-full p-4 rounded-2xl bg-slate-50 font-bold text-sm outline-none shadow-inner" />
                 </div>
              </div>
            )}

            <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-[1.5rem] font-black uppercase text-xs shadow-xl active:scale-95 transition-all mt-4">Guardar Cambios</button>
         </form>
      </Modal>
    </div>
  );
};

const QuickItem = ({ onClick, label, sub, icon, color }: { onClick: () => void, label: string, sub: string, icon: React.ReactNode, color: string }) => (
  <button onClick={onClick} className="w-full flex items-center gap-3 p-4 rounded-2xl hover:bg-slate-50 transition-all text-left group">
    <div className={`${color} opacity-60 group-hover:opacity-100 transition-opacity`}>{icon}</div>
    <div>
      <p className="text-[11px] font-black uppercase tracking-tight text-slate-800 italic leading-none mb-1">{label}</p>
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">{sub}</p>
    </div>
  </button>
);

const StatusLabel = ({ type }: { type: DayType }) => {
  const styles = {
    work: 'bg-blue-50 text-blue-600 border-blue-100',
    off: 'bg-slate-50 text-slate-500 border-slate-100',
    vacation: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    medical: 'bg-rose-50 text-rose-600 border-rose-100'
  };
  return (
    <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded-full border tracking-widest ${styles[type]}`}>
      {type}
    </span>
  );
};

export default History;
