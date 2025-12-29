
import React, { useMemo, useState } from 'react';
import { 
  Trash2, Edit2, Plus, Moon, Coffee, HeartPulse, Palmtree, Briefcase,
  Loader2, Image as ImageIcon, ChevronDown
} from 'lucide-react';
import { WorkDay, DayType } from '../types';
import { calculateDuration, getLocalDateString } from '../utils';
import Modal from './Modal';
import html2canvas from 'html2canvas';

interface HistoryProps {
  workDays: WorkDay[];
  setWorkDays: React.Dispatch<React.SetStateAction<WorkDay[]>>;
}

const History: React.FC<HistoryProps> = ({ workDays, setWorkDays }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDay, setEditingDay] = useState<Partial<WorkDay> | null>(null);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const sortedDays = useMemo(() => {
    return [...workDays].sort((a, b) => b.date.localeCompare(a.date));
  }, [workDays]);

  const handleExportImage = async () => {
    const element = document.getElementById('history-list-capture');
    if (!element || sortedDays.length === 0) return;

    setIsExporting(true);
    element.classList.add('is-capturing');

    try {
      await new Promise(r => setTimeout(r, 300));
      
      const canvas = await html2canvas(element, {
        scale: 3,
        backgroundColor: '#f8fafc', 
        logging: false,
        useCORS: true,
        width: element.offsetWidth,
        height: element.offsetHeight,
      });

      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `Historial_Laboral_${new Date().toISOString().split('T')[0]}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error exportando imagen:', error);
    } finally {
      element.classList.remove('is-capturing');
      setIsExporting(false);
    }
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
        <div>
          <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">Historial</h2>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Registros Locales</p>
        </div>
        <div className="flex gap-2.5 relative">
          <button 
            onClick={() => setShowQuickMenu(!showQuickMenu)}
            className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Agregar
          </button>
          <button 
            onClick={handleExportImage} 
            disabled={isExporting || sortedDays.length === 0}
            className="bg-slate-900 text-white p-3 rounded-2xl transition-all flex items-center justify-center disabled:opacity-50 shadow-lg active:scale-90"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
          </button>
          
          {showQuickMenu && (
            <div className="absolute right-0 top-14 w-56 bg-white rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
               <div className="p-1.5 space-y-0.5">
                 <QuickItem onClick={() => openManualEntry('FULL')} label="Jornada 8h" sub="08:00 a 16:30" icon={<Briefcase />} color="text-blue-600" />
                 <QuickItem onClick={() => openManualEntry('LIBRE')} label="Día Libre" sub="Sin horas" icon={<Moon />} color="text-slate-400" />
                 <QuickItem onClick={() => openManualEntry('NONE')} label="Manual" sub="Carga libre" icon={<Edit2 />} color="text-indigo-400" />
               </div>
            </div>
          )}
        </div>
      </div>

      <div id="history-list-capture" className="space-y-3 p-1 max-w-full">
        <div className="hidden show-on-capture mb-6 border-b-4 border-slate-900 pb-4">
           <h3 className="text-xl font-black italic uppercase text-slate-900">Historial Laboral - Uruguay</h3>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Generado el {new Date().toLocaleDateString('es-UY')}</p>
        </div>

        {sortedDays.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-[2rem] border-2 border-dashed border-slate-100">
             <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest">No hay registros</p>
          </div>
        ) : (
          sortedDays.map(day => {
            const dur = calculateDuration(day);
            const extra = Math.max(0, dur - 8);
            const dateObj = new Date(day.date + 'T00:00:00');
            const isSpec = day.type !== 'work';
            
            return (
              <div key={day.id} className="bg-white rounded-[1.5rem] p-4 shadow-sm border border-slate-100 flex justify-between items-center transition-all hover:shadow-md group relative overflow-hidden">
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                   <div className="text-center bg-slate-50 p-2 rounded-xl min-w-[50px] shrink-0 border border-slate-100/50">
                      <p className="text-[7px] font-black text-slate-400 uppercase leading-none mb-1">{dateObj.toLocaleDateString('es-UY', { weekday: 'short' })}</p>
                      <p className="text-lg font-black text-slate-800 leading-none italic tabular-nums">{dateObj.getDate()}</p>
                   </div>
                   <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5 overflow-hidden">
                         <p className="font-black text-[11px] text-slate-900 uppercase italic tracking-tight whitespace-nowrap">{dateObj.toLocaleDateString('es-UY', { month: 'short', year: 'numeric' })}</p>
                         <StatusLabel type={day.type} />
                      </div>
                      {!isSpec ? (
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate tabular-nums">
                          {getTimeValue(day.entryTime)}—{getTimeValue(day.exitTime)} 
                          {day.breakStartTime && <span className="text-amber-500 ml-1 font-black">/D</span>}
                        </p>
                      ) : (
                        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest italic truncate">Jornada especial</p>
                      )}
                   </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                   {!isSpec && (
                     <div className="text-right flex flex-col items-end">
                        <p className="text-base font-black italic text-slate-900 leading-none tabular-nums">{dur.toFixed(1)}h</p>
                        {extra > 0 && <p className="text-[7px] font-black text-blue-500 uppercase tracking-tighter mt-1">+{extra.toFixed(1)} EX</p>}
                     </div>
                   )}
                   <div className="flex gap-0.5 hide-on-capture opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openManualEntry('NONE', day)} className="p-1.5 text-slate-300 hover:text-blue-600"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDeleteConfirmationId(day.id)} className="p-1.5 text-slate-300 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                   </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Modal isOpen={!!deleteConfirmationId} onClose={() => setDeleteConfirmationId(null)} title="Eliminar Registro">
         <div className="text-center space-y-6">
            <div className="bg-rose-50 w-16 h-16 rounded-[1.5rem] flex items-center justify-center mx-auto text-rose-500 shadow-inner">
               <Trash2 className="w-8 h-8" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">¿Confirmas la eliminación?</p>
            <button 
              onClick={() => { setWorkDays(prev => prev.filter(d => d.id !== deleteConfirmationId)); setDeleteConfirmationId(null); }} 
              className="w-full bg-rose-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] shadow-xl active:scale-95"
            >
              Confirmar
            </button>
         </div>
      </Modal>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Detalle de Jornada">
         <form onSubmit={saveManualEntry} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
               <div>
                  <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Fecha</label>
                  <input type="date" value={editingDay?.date || ''} onChange={e => setEditingDay({...editingDay!, date: e.target.value})} className="w-full p-3.5 rounded-xl bg-slate-50 font-bold text-xs outline-none shadow-inner" />
               </div>
               <div>
                  <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Tipo</label>
                  <select value={editingDay?.type} onChange={e => setEditingDay({...editingDay!, type: e.target.value as DayType})} className="w-full p-3.5 rounded-xl bg-slate-50 font-bold text-xs outline-none shadow-inner">
                     <option value="work">Trabajo</option>
                     <option value="off">Libre</option>
                     <option value="vacation">Licencia</option>
                     <option value="medical">Médico</option>
                  </select>
               </div>
            </div>

            {editingDay?.type === 'work' && (
              <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                 <div className="grid grid-cols-2 gap-3">
                    <div>
                       <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Entrada</label>
                       <input type="time" value={getTimeValue(editingDay.entryTime)} onChange={e => handleTimeChange('entryTime', e.target.value)} className="w-full p-3.5 rounded-xl bg-slate-50 font-bold text-xs outline-none shadow-inner" />
                    </div>
                    <div>
                       <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Salida</label>
                       <input type="time" value={getTimeValue(editingDay.exitTime)} onChange={e => handleTimeChange('exitTime', e.target.value)} className="w-full p-3.5 rounded-xl bg-slate-50 font-bold text-xs outline-none shadow-inner" />
                    </div>
                 </div>
                 <div className="p-4 bg-slate-50 rounded-[1.2rem] border border-slate-100 space-y-3">
                    <p className="text-[8px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-1.5"><Coffee className="w-3 h-3" /> Descanso</p>
                    <div className="grid grid-cols-2 gap-2">
                       <input type="time" value={getTimeValue(editingDay.breakStartTime)} onChange={e => handleTimeChange('breakStartTime', e.target.value)} className="w-full p-2.5 rounded-lg bg-white font-bold text-[10px] outline-none shadow-sm" />
                       <input type="time" value={getTimeValue(editingDay.breakEndTime)} onChange={e => handleTimeChange('breakEndTime', e.target.value)} className="w-full p-2.5 rounded-lg bg-white font-bold text-[10px] outline-none shadow-sm" />
                    </div>
                 </div>
              </div>
            )}

            <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] shadow-xl active:scale-95 transition-all mt-2">Guardar</button>
         </form>
      </Modal>

      <style>{`
        .is-capturing .hide-on-capture { display: none !important; }
        .is-capturing .show-on-capture { display: block !important; }
        .is-capturing { width: 440px !important; margin: 0 auto !important; padding: 20px !important; }
        .is-capturing .group-hover\:opacity-100 { opacity: 0 !important; }
      `}</style>
    </div>
  );
};

const QuickItem = ({ onClick, label, sub, icon, color }: { onClick: () => void, label: string, sub: string, icon: React.ReactNode, color: string }) => (
  <button onClick={onClick} className="w-full flex items-center gap-2.5 p-3 rounded-xl hover:bg-slate-50 transition-all text-left group">
    <div className={`${color} opacity-60 group-hover:opacity-100 transition-opacity shrink-0`}>{React.cloneElement(icon as React.ReactElement<any>, { className: 'w-4 h-4' })}</div>
    <div className="min-w-0">
      <p className="text-[10px] font-black uppercase tracking-tight text-slate-800 italic leading-none mb-0.5 truncate">{label}</p>
      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none truncate">{sub}</p>
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
  const labels = {
    work: 'WORK',
    off: 'FREE',
    vacation: 'VAC',
    medical: 'MED'
  };
  return (
    <span className={`text-[6px] font-black uppercase px-1.5 py-0.5 rounded-md border tracking-[0.1em] shrink-0 ${styles[type]}`}>
      {labels[type]}
    </span>
  );
};

export default History;
