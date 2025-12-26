
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
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Generador de Reportes Profesionales</p>
        </div>
        <button 
          onClick={handleDownload}
          disabled={isExporting || sortedDays.length === 0}
          className={`flex items-center gap-3 px-6 py-4 rounded-[2rem] font-black text-[11px] uppercase tracking-widest shadow-2xl transition-all active:scale-95 disabled:opacity-50 ${
            exported ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white'
          }`}
        >
          {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : exported ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4 text-blue-400" />}
          {isExporting ? 'Procesando...' : exported ? 'Exportado' : 'Bajar PNG'}
        </button>
      </div>

      {sortedDays.length === 0 ? (
        <div className="bg-white p-20 rounded-[3rem] border-4 border-dashed border-slate-100 text-center space-y-5">
          <div className="bg-slate-50 w-20 h-20 rounded-[2.5rem] flex items-center justify-center mx-auto text-slate-200">
             <FileText className="w-10 h-10" />
          </div>
          <p className="text-slate-400 font-black text-[11px] uppercase tracking-widest leading-relaxed">Sin registros confirmados para<br/>generar el reporte maestro.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[3rem] shadow-[0_30px_70px_-20px_rgba(0,0,0,0.15)] border border-slate-100 bg-white">
          <div 
            id="receipt-capture-area-pro" 
            className="bg-white p-10 sm:p-14 text-slate-800"
          >
            <div className="flex justify-between items-start border-b-8 border-slate-900 pb-10 mb-12">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="bg-slate-900 p-2 rounded-xl text-white shadow-xl rotate-6"><ShieldCheck className="w-6 h-6" /></div>
                  <h1 className="text-3xl font-black italic uppercase tracking-tighter leading-none text-slate-900">Reporte Laboral</h1>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Compliance & Salary Management Tool</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Status</p>
                <div className="bg-blue-600 text-white px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-tighter">Verified Private</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-10 mb-12">
              <div className="space-y-6">
                <div>
                   <p className="text-[10px] uppercase font-black text-slate-400 mb-2 tracking-widest">Profesional</p>
                   <p className="font-black text-2xl text-slate-900 leading-none uppercase italic tracking-tighter">{settings.workerName}</p>
                </div>
                <div>
                   <p className="text-[10px] uppercase font-black text-slate-400 mb-2 tracking-widest">Establecimiento</p>
                   <p className="font-black text-base text-slate-600 leading-none uppercase tracking-tight">{settings.workplaceName || 'Empresa No Definida'}</p>
                </div>
              </div>
              <div className="text-right space-y-6">
                <div>
                   <p className="text-[10px] uppercase font-black text-slate-400 mb-2 tracking-widest">Sueldo Base (Nominal)</p>
                   <p className="font-black text-2xl text-blue-600 leading-none italic">{formatCurrency(settings.monthlySalary)}</p>
                </div>
                <div>
                   <p className="text-[10px] uppercase font-black text-slate-400 mb-2 tracking-widest">Generado</p>
                   <p className="font-black text-xs text-slate-400 uppercase tracking-widest">{new Date().toLocaleDateString('es-UY')}</p>
                </div>
              </div>
            </div>

            <div className="mb-14">
               <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900 mb-6 border-b-2 border-slate-100 pb-3 italic">Registro de Actividad Mensual</h4>
               <table className="w-full text-xs border-collapse">
                 <thead>
                   <tr className="text-slate-400 border-b border-slate-50">
                     <th className="text-left py-4 font-black uppercase tracking-widest text-[10px]">Fecha</th>
                     <th className="text-center py-4 font-black uppercase tracking-widest text-[10px]">Tipo</th>
                     <th className="text-center py-4 font-black uppercase tracking-widest text-[10px]">Horas</th>
                     <th className="text-center py-4 font-black uppercase tracking-widest text-[10px]">Extras</th>
                     <th className="text-right py-4 font-black uppercase tracking-widest text-[10px]">Bruto</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                   {sortedDays.map(day => {
                     const { gross, duration, extraHours } = getDayFinancials(day, summary.hourlyRate);
                     return (
                       <tr key={day.id} className="font-bold">
                         <td className="py-5 text-slate-600 text-[11px]">{new Date(day.date + 'T00:00:00').toLocaleDateString('es-UY', { day: '2-digit', month: 'short' })}</td>
                         <td className="py-5 text-center">
                            <span className={`text-[8px] px-2 py-1 rounded-full uppercase font-black border ${
                               day.type === 'work' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                               day.type === 'vacation' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                               'bg-slate-50 text-slate-600 border-slate-100'
                            }`}>{day.type}</span>
                         </td>
                         <td className="py-5 text-center text-slate-900 text-[11px]">{duration.toFixed(1)}h</td>
                         <td className="py-5 text-center text-blue-600 text-[11px]">{extraHours > 0 ? `+${extraHours.toFixed(1)}` : '-'}</td>
                         <td className="py-5 text-right text-slate-900 text-[11px]">{formatCurrency(gross)}</td>
                       </tr>
                     );
                   })}
                 </tbody>
               </table>
            </div>

            <div className="space-y-6 bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden border-t-8 border-blue-600">
              <div className="absolute top-0 right-0 p-6 opacity-5 rotate-12">
                 <ShieldCheck className="w-32 h-32" />
              </div>
              
              <div className="grid grid-cols-2 gap-y-3 gap-x-12">
                 <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                   <span className="font-black uppercase tracking-widest text-[9px] opacity-60">Suma de Haberes</span>
                   <span className="font-black">{formatCurrency(summary.totalGross)}</span>
                 </div>
                 <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                   <span className="font-black uppercase tracking-widest text-[9px] text-rose-400">Deducción Ley (22%)</span>
                   <span className="font-black text-rose-400">-{formatCurrency(summary.bpsDiscount)}</span>
                 </div>
                 {summary.totalAdvances > 0 && (
                   <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                     <span className="font-black uppercase tracking-widest text-[9px] text-amber-400">Adelantos</span>
                     <span className="font-black text-amber-400">-{formatCurrency(summary.totalAdvances)}</span>
                   </div>
                 )}
                 <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                   <span className="font-black uppercase tracking-widest text-[9px] text-emerald-400">Viáticos Acumulados</span>
                   <span className="font-black text-emerald-400">+{formatCurrency(summary.totalAllowances)}</span>
                 </div>
              </div>
              
              <div className="flex justify-between items-end pt-10 mt-6">
                <div>
                  <p className="font-black text-blue-400 uppercase tracking-[0.4em] text-xs italic mb-1">Neto Liquido Final</p>
                  <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Total Estimado a Percibir</p>
                </div>
                <span className="text-5xl font-black italic tracking-tighter leading-none text-white">{formatCurrency(summary.netPay)}</span>
              </div>
            </div>

            <div className="mt-14 pt-10 border-t-2 border-slate-50 flex justify-between items-center opacity-30">
              <div className="flex items-center gap-3">
                 <p className="text-[10px] font-black italic text-slate-900">Registro Laboral Pro</p>
              </div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Uruguay • BPS Standard Calculation</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Receipt;
