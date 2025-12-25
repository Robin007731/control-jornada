
import React, { useState } from 'react';
import { WorkDay, UserSettings, Advance } from '../types';
import { getSummary, formatCurrency, getDayFinancials } from '../utils';
import { Download, Share2, Loader2, Check, ShieldCheck, FileText, Smartphone } from 'lucide-react';
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

  const dateRange = sortedDays.length > 0 
    ? `${new Date(sortedDays[0].date).toLocaleDateString('es-UY', { day: '2-digit', month: 'short' })} - ${new Date(sortedDays[sortedDays.length - 1].date).toLocaleDateString('es-UY', { day: '2-digit', month: 'short', year: 'numeric' })}`
    : 'Período vacío';

  const handleDownload = async () => {
    const element = document.getElementById('receipt-capture-area');
    if (!element) return;

    setIsExporting(true);
    try {
      const canvas = await html2canvas(element, {
        scale: 3, // Alta resolución para lectura clara
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        windowWidth: 800 // Ancho fijo para consistencia
      });

      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `Recibo_Llavpodes_${settings.workerName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.png`;
      link.href = dataUrl;
      link.click();
      
      setExported(true);
      setTimeout(() => setExported(false), 3000);
    } catch (error) {
      console.error('Error al exportar recibo:', error);
      alert('Error al generar la imagen. Inténtalo de nuevo.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-xl mx-auto pb-10">
      <div className="flex justify-between items-center px-1">
        <div>
          <h2 className="text-xl font-black italic uppercase tracking-tighter">Recibo</h2>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Control de Ganancias</p>
        </div>
        <button 
          onClick={handleDownload}
          disabled={isExporting || sortedDays.length === 0}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all active:scale-95 disabled:opacity-50 ${
            exported ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white'
          }`}
        >
          {isExporting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : exported ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <FileText className="w-3.5 h-3.5" />
          )}
          {isExporting ? 'Generando...' : exported ? '¡Listo!' : 'Exportar PNG'}
        </button>
      </div>

      {sortedDays.length === 0 ? (
        <div className="bg-white p-16 rounded-[40px] border-2 border-dashed border-slate-100 text-center space-y-4">
          <div className="bg-slate-50 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto text-slate-200">
             <FileText className="w-8 h-8" />
          </div>
          <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest leading-relaxed">No hay registros completados<br/>para generar el reporte.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[40px] shadow-2xl border border-slate-100 bg-white">
          <div 
            id="receipt-capture-area" 
            className="bg-white p-8 sm:p-12 text-slate-800"
          >
            {/* Header Recibo */}
            <div className="flex justify-between items-start border-b-4 border-slate-900 pb-8 mb-10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="bg-slate-900 p-1 rounded text-white"><ShieldCheck className="w-4 h-4" /></div>
                  <h1 className="text-2xl font-black italic uppercase tracking-tighter leading-none">Llavpodes</h1>
                </div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em]">Registro Laboral Personal</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] uppercase font-black text-slate-400 tracking-widest mb-1">Período</p>
                <p className="font-black text-sm uppercase tracking-tighter">{dateRange}</p>
              </div>
            </div>

            {/* Info Trabajador */}
            <div className="mb-12 grid grid-cols-2 gap-8">
              <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                <p className="text-[8px] uppercase font-black text-slate-400 mb-2 tracking-widest">Titular</p>
                <p className="font-black text-lg text-slate-900 leading-none uppercase tracking-tight">{settings.workerName}</p>
              </div>
              <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 text-right">
                <p className="text-[8px] uppercase font-black text-slate-400 mb-2 tracking-widest">Sueldo Base</p>
                <p className="font-black text-lg text-slate-700 leading-none">{formatCurrency(settings.monthlySalary)}</p>
              </div>
            </div>

            {/* Tabla Horas */}
            <div className="mb-12">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-100 pb-2 italic">Detalle de Jornadas</h4>
               <table className="w-full text-xs border-collapse">
                 <thead>
                   <tr className="text-slate-400">
                     <th className="text-left py-2 font-black uppercase tracking-widest text-[9px]">Día</th>
                     <th className="text-center py-2 font-black uppercase tracking-widest text-[9px]">Horas</th>
                     <th className="text-center py-2 font-black uppercase tracking-widest text-[9px]">Extras</th>
                     <th className="text-right py-2 font-black uppercase tracking-widest text-[9px]">Subtotal</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                   {sortedDays.map(day => {
                     const { gross, duration, extraHours } = getDayFinancials(day, summary.hourlyRate);
                     return (
                       <tr key={day.id} className="font-bold">
                         <td className="py-3 text-slate-600">{new Date(day.date).toLocaleDateString('es-UY', { day: '2-digit', month: 'short' })}</td>
                         <td className="py-3 text-center text-slate-800">{duration.toFixed(1)}h</td>
                         <td className="py-3 text-center text-amber-600">{extraHours > 0 ? `${extraHours.toFixed(1)}h` : '-'}</td>
                         <td className="py-3 text-right text-slate-900">{formatCurrency(gross)}</td>
                       </tr>
                     );
                   })}
                 </tbody>
               </table>
            </div>

            {/* Totales Reales */}
            <div className="space-y-4 bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                 <Smartphone className="w-24 h-24" />
              </div>
              <div className="flex justify-between items-center text-xs opacity-60">
                <span className="font-black uppercase tracking-widest text-[9px]">Bruto Acumulado</span>
                <span className="font-black">{formatCurrency(summary.totalGross)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-black uppercase tracking-widest text-[9px] text-red-400">Descuentos Ley (22%)</span>
                <span className="font-black text-red-400">-{formatCurrency(summary.bpsDiscount)}</span>
              </div>
              {summary.totalAdvances > 0 && (
                <div className="flex justify-between items-center text-xs">
                  <span className="font-black uppercase tracking-widest text-[9px] text-amber-400">Adelantos Percibidos</span>
                  <span className="font-black text-amber-400">-{formatCurrency(summary.totalAdvances)}</span>
                </div>
              )}
              {summary.totalAllowances > 0 && (
                <div className="flex justify-between items-center text-xs">
                  <span className="font-black uppercase tracking-widest text-[9px] text-emerald-400">Viáticos / Otros (+)</span>
                  <span className="font-black text-emerald-400">+{formatCurrency(summary.totalAllowances)}</span>
                </div>
              )}
              
              <div className="flex justify-between items-end pt-6 border-t border-white/10 mt-6">
                <div>
                  <p className="font-black text-blue-400 uppercase tracking-[0.2em] text-[10px] italic">Líquido Estimado</p>
                  <p className="text-[7px] font-bold text-slate-500 uppercase">Monto a percibir en mano</p>
                </div>
                <span className="text-4xl font-black italic tracking-tighter leading-none">{formatCurrency(summary.netPay)}</span>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-slate-50 flex justify-between items-end opacity-20">
              <div className="space-y-1">
                <p className="text-[8px] font-black uppercase tracking-[0.3em]">Llavpodes • Reporte Privado</p>
                <p className="text-[7px] font-bold italic">Soberanía del tiempo y la ganancia</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black italic">Uruguay 2024</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Receipt;
