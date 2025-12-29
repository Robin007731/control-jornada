
import React, { useState } from 'react';
import { WorkDay, UserSettings, Advance } from '../types';
import { getSummary, formatCurrency, getDayFinancials } from '../utils';
import { Share2, Loader2, Check, ShieldCheck, FileText, Download } from 'lucide-react';
import html2canvas from 'html2canvas';

interface ReceiptProps {
  workDays: WorkDay[];
  settings: UserSettings;
  advances: Advance[];
}

const Receipt: React.FC<ReceiptProps> = ({ workDays, settings, advances }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exported, setExported] = useState(false);
  const summary = getSummary(workDays, settings, advances);
  const hasFinancialData = settings.monthlySalary > 0;
  
  const sortedDays = [...workDays]
    .filter(d => d.status === 'complete')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const handleDownload = async () => {
    const element = document.getElementById('receipt-capture-area-pro');
    if (!element) return;

    setIsExporting(true);
    try {
      const canvas = await html2canvas(element, {
        scale: 4,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
      });

      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `Reporte_${settings.workerName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.png`;
      link.href = dataUrl;
      link.click();
      
      setExported(true);
      setTimeout(() => setExported(false), 3000);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-xl mx-auto pb-12">
      <div className="flex justify-between items-center px-2">
        <div className="space-y-1">
          <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">Report Center</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Generador de Reportes</p>
        </div>
        <button 
          onClick={handleDownload}
          disabled={isExporting || sortedDays.length === 0}
          className={`flex items-center gap-3 px-5 py-3.5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-xl transition-all active:scale-95 disabled:opacity-50 ${
            exported ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white'
          }`}
        >
          {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : exported ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4 text-blue-400" />}
          {isExporting ? '...' : exported ? 'Exportado' : 'PNG'}
        </button>
      </div>

      {sortedDays.length === 0 ? (
        <div className="bg-white p-16 rounded-[2.5rem] border-4 border-dashed border-slate-100 text-center space-y-4">
          <div className="bg-slate-50 w-16 h-16 rounded-[1.5rem] flex items-center justify-center mx-auto text-slate-200">
             <FileText className="w-8 h-8" />
          </div>
          <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest leading-relaxed">Sin registros para reporte.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[2.5rem] shadow-2xl border border-slate-100 bg-white">
          <div 
            id="receipt-capture-area-pro" 
            className="bg-white p-8 sm:p-12 text-slate-800"
            style={{ width: '100%', maxWidth: '750px', margin: '0 auto' }}
          >
            <div className="flex justify-between items-start border-b-8 border-slate-900 pb-8 mb-10">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <div className="bg-slate-900 p-2 rounded-xl text-white shadow-lg rotate-3"><ShieldCheck className="w-5 h-5" /></div>
                  <h1 className="text-2xl font-black italic uppercase tracking-tighter leading-none text-slate-900">Reporte Laboral</h1>
                </div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.25em]">Private & Validated Tracking</p>
              </div>
              <div className="text-right">
                <p className="text-[8px] uppercase font-black text-slate-400 tracking-widest mb-1">Status</p>
                <div className="bg-blue-600 text-white px-3 py-1 rounded-full font-black text-[8px] uppercase tracking-tighter shadow-sm">Verified</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-10">
              <div className="space-y-5 min-w-0">
                <div className="min-w-0 overflow-hidden">
                   <p className="text-[8px] uppercase font-black text-slate-400 mb-1.5 tracking-widest">Profesional</p>
                   <p className="font-black text-xl text-slate-900 leading-none uppercase italic tracking-tighter truncate max-w-full">{settings.workerName}</p>
                </div>
                <div className="min-w-0 overflow-hidden">
                   <p className="text-[8px] uppercase font-black text-slate-400 mb-1.5 tracking-widest">Empresa</p>
                   <p className="font-black text-sm text-slate-600 leading-none uppercase tracking-tight truncate max-w-full">{settings.workplaceName || 'N/D'}</p>
                </div>
              </div>
              <div className="text-right space-y-5 min-w-0">
                {hasFinancialData && (
                  <div className="min-w-0">
                    <p className="text-[8px] uppercase font-black text-slate-400 mb-1.5 tracking-widest">Sueldo Nominal</p>
                    <p className="font-black text-xl text-blue-600 leading-none italic tabular-nums">{formatCurrency(settings.monthlySalary)}</p>
                  </div>
                )}
                <div>
                   <p className="text-[8px] uppercase font-black text-slate-400 mb-1.5 tracking-widest">Generado</p>
                   <p className="font-black text-[10px] text-slate-400 uppercase tracking-widest tabular-nums">{new Date().toLocaleDateString('es-UY')}</p>
                </div>
              </div>
            </div>

            <div className="mb-12 overflow-hidden">
               <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-900 mb-5 border-b-2 border-slate-100 pb-2 italic">Registro de Actividad</h4>
               <table className="w-full text-xs border-collapse table-fixed">
                 <thead>
                   <tr className="text-slate-400 border-b border-slate-100">
                     <th className="text-left py-3 font-black uppercase tracking-widest text-[8px] w-[18%]">Fecha</th>
                     <th className="text-center py-3 font-black uppercase tracking-widest text-[8px] w-[22%]">Tipo</th>
                     <th className="text-center py-3 font-black uppercase tracking-widest text-[8px] w-[15%]">Horas</th>
                     <th className="text-center py-3 font-black uppercase tracking-widest text-[8px] w-[15%]">Ex</th>
                     {hasFinancialData && <th className="text-right py-3 font-black uppercase tracking-widest text-[8px] w-[30%]">Monto</th>}
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                   {sortedDays.map(day => {
                     const { gross, duration, extraHours } = getDayFinancials(day, summary.hourlyRate);
                     return (
                       <tr key={day.id} className="font-bold">
                         <td className="py-4 text-slate-600 text-[9px] tabular-nums whitespace-nowrap overflow-hidden text-ellipsis">
                            {new Date(day.date + 'T00:00:00').toLocaleDateString('es-UY', { day: '2-digit', month: 'short' })}
                         </td>
                         <td className="py-4 text-center overflow-hidden">
                            <span className={`text-[6px] px-1.5 py-0.5 rounded-md uppercase font-black border tracking-wider inline-block max-w-full truncate ${
                               day.type === 'work' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                               day.type === 'vacation' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                               'bg-slate-50 text-slate-600 border-slate-100'
                            }`}>{day.type}</span>
                         </td>
                         <td className="py-4 text-center text-slate-900 text-[9px] tabular-nums">{duration.toFixed(1)}h</td>
                         <td className="py-4 text-center text-blue-600 text-[9px] tabular-nums">{extraHours > 0 ? `+${extraHours.toFixed(1)}` : '—'}</td>
                         {hasFinancialData && <td className="py-4 text-right text-slate-900 text-[9px] tabular-nums whitespace-nowrap overflow-hidden text-ellipsis">{formatCurrency(gross)}</td>}
                       </tr>
                     );
                   })}
                 </tbody>
               </table>
            </div>

            {hasFinancialData && (
              <div className="space-y-6 bg-slate-900 text-white p-8 rounded-[2rem] shadow-xl relative overflow-hidden border-t-8 border-blue-600">
                <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12">
                   <ShieldCheck className="w-24 h-24" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2.5 gap-x-10">
                   <div className="flex justify-between items-center text-[10px] border-b border-white/5 pb-1.5 overflow-hidden">
                     <span className="font-black uppercase tracking-widest text-[8px] opacity-60">Suma Haberes</span>
                     <span className="font-black tabular-nums truncate ml-2">{formatCurrency(summary.totalGross)}</span>
                   </div>
                   <div className="flex justify-between items-center text-[10px] border-b border-white/5 pb-1.5 overflow-hidden">
                     <span className="font-black uppercase tracking-widest text-[8px] text-rose-400">Ley (22%)</span>
                     <span className="font-black text-rose-400 tabular-nums truncate ml-2">-{formatCurrency(summary.bpsDiscount)}</span>
                   </div>
                   {summary.totalAdvances > 0 && (
                     <div className="flex justify-between items-center text-[10px] border-b border-white/5 pb-1.5 overflow-hidden">
                       <span className="font-black uppercase tracking-widest text-[8px] text-amber-400">Adelantos</span>
                       <span className="font-black text-amber-400 tabular-nums truncate ml-2">-{formatCurrency(summary.totalAdvances)}</span>
                     </div>
                   )}
                   <div className="flex justify-between items-center text-[10px] border-b border-white/5 pb-1.5 overflow-hidden">
                     <span className="font-black uppercase tracking-widest text-[8px] text-emerald-400">Viáticos</span>
                     <span className="font-black text-emerald-400 tabular-nums truncate ml-2">+{formatCurrency(summary.totalAllowances)}</span>
                   </div>
                </div>
                
                <div className="flex justify-between items-end pt-8 mt-4 flex-wrap gap-4 overflow-hidden">
                  <div className="shrink-0">
                    <p className="font-black text-blue-400 uppercase tracking-[0.3em] text-[10px] italic mb-0.5">Líquido Final</p>
                    <p className="text-[7px] font-bold text-slate-500 uppercase tracking-widest">Total a Percibir</p>
                  </div>
                  <span className="text-4xl font-black italic tracking-tighter leading-none text-white tabular-nums truncate max-w-full">{formatCurrency(summary.netPay)}</span>
                </div>
              </div>
            )}

            {!hasFinancialData && (
              <div className="bg-slate-50 p-8 rounded-[2rem] text-center border-2 border-dashed border-slate-200 overflow-hidden">
                 <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1.5">Resumen de Horas</p>
                 <p className="text-3xl font-black italic text-slate-900 tabular-nums">{(summary.totalNormalHours + summary.totalExtraHours).toFixed(1)} <span className="text-sm">H</span></p>
              </div>
            )}

            <div className="mt-10 pt-8 border-t border-slate-50 flex justify-between items-center opacity-40">
              <p className="text-[8px] font-black italic text-slate-900 uppercase">Registro Laboral Pro</p>
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Uruguay • Estándar 2024</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Receipt;
