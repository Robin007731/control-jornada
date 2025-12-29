
import React, { useState } from 'react';
import { WorkDay, UserSettings, Advance } from '../types';
import { getSummary, formatCurrency, getDayFinancials } from '../utils';
import { Loader2, Check, ShieldCheck, FileText, Download } from 'lucide-react';
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
    
    // Forzamos un scroll al inicio para evitar cortes en la captura si el elemento es largo
    window.scrollTo(0, 0);

    try {
      // Pequeña espera para asegurar que los estilos de hover o transiciones no afecten
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(element, {
        scale: 4, // Ultra alta resolución para claridad "Full HD"
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: true,
        width: 800, // Ancho fijo de documento para consistencia
        windowWidth: 800, // Emulamos un ancho de ventana para el layout interno
        onclone: (clonedDoc) => {
          const clonedEl = clonedDoc.getElementById('receipt-capture-area-pro');
          if (clonedEl) {
            clonedEl.style.width = '800px';
            clonedEl.style.padding = '60px';
            clonedEl.style.borderRadius = '0';
            clonedEl.style.boxShadow = 'none';
            clonedEl.style.margin = '0';
          }
        }
      });

      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `Reporte_${settings.workerName.trim().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.png`;
      link.href = dataUrl;
      link.click();
      
      setExported(true);
      setTimeout(() => setExported(false), 3000);
    } catch (error) {
      console.error('Error al exportar reporte:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-xl mx-auto pb-12">
      <div className="flex justify-between items-center px-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">Report Center</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Calidad Profesional • 100% Privado</p>
        </div>
        <button 
          onClick={handleDownload}
          disabled={isExporting || sortedDays.length === 0}
          className={`flex items-center gap-3 px-6 py-4 rounded-[1.8rem] font-black text-[11px] uppercase tracking-widest shadow-2xl transition-all active:scale-95 disabled:opacity-50 ${
            exported ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white'
          }`}
        >
          {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : exported ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4 text-blue-400" />}
          {isExporting ? 'Procesando...' : exported ? 'Exportado' : 'Descargar'}
        </button>
      </div>

      {sortedDays.length === 0 ? (
        <div className="bg-white p-20 rounded-[3rem] border-4 border-dashed border-slate-100 text-center space-y-5 mx-4">
          <div className="bg-slate-50 w-20 h-20 rounded-[2.5rem] flex items-center justify-center mx-auto text-slate-200">
             <FileText className="w-10 h-10" />
          </div>
          <p className="text-slate-400 font-black text-[11px] uppercase tracking-widest leading-relaxed">No hay jornadas suficientes para<br/>generar este documento.</p>
        </div>
      ) : (
        <div className="overflow-x-auto sm:overflow-visible mx-4 rounded-[3rem] shadow-2xl border border-slate-100 bg-white scrollbar-hide">
          <div 
            id="receipt-capture-area-pro" 
            className="bg-white p-10 sm:p-14 text-slate-800"
            style={{ minWidth: '700px' }} // Asegura que en móviles no se comprima el layout antes de la captura
          >
            {/* Cabecera del Documento */}
            <div className="flex justify-between items-start border-b-[8px] border-slate-900 pb-10 mb-12">
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="bg-slate-900 p-3 rounded-2xl text-white shadow-xl rotate-3">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none text-slate-900">Informe de Actividad</h1>
                </div>
                <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.4em]">Resumen Laboral • Estándar Uruguay</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1.5">Certificado</p>
                <div className="bg-blue-600 text-white px-5 py-2 rounded-full font-black text-[10px] uppercase tracking-tighter shadow-md">Registro Local</div>
              </div>
            </div>

            {/* Información Personal y Empresa */}
            <div className="grid grid-cols-2 gap-16 mb-14">
              <div className="space-y-8">
                <div className="max-w-xs">
                   <p className="text-[10px] uppercase font-black text-slate-400 mb-2 tracking-widest">Titular del Registro</p>
                   <p className="font-black text-3xl text-slate-900 leading-tight uppercase italic tracking-tighter break-words line-clamp-2">{settings.workerName}</p>
                </div>
                <div className="max-w-xs">
                   <p className="text-[10px] uppercase font-black text-slate-400 mb-2 tracking-widest">Lugar de Trabajo</p>
                   <p className="font-black text-lg text-slate-600 leading-tight uppercase tracking-tight break-words line-clamp-2">{settings.workplaceName || 'Empresa Independiente'}</p>
                </div>
              </div>
              <div className="text-right space-y-8">
                {hasFinancialData && (
                  <div>
                    <p className="text-[10px] uppercase font-black text-slate-400 mb-2 tracking-widest">Salario Base (Nominal)</p>
                    <p className="font-black text-3xl text-blue-600 leading-none italic tabular-nums">{formatCurrency(settings.monthlySalary)}</p>
                  </div>
                )}
                <div>
                   <p className="text-[10px] uppercase font-black text-slate-400 mb-2 tracking-widest">Fecha de Generación</p>
                   <p className="font-black text-sm text-slate-500 uppercase tracking-widest tabular-nums">{new Date().toLocaleDateString('es-UY', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                </div>
              </div>
            </div>

            {/* Listado de Jornadas */}
            <div className="mb-14">
               <div className="flex justify-between items-end mb-8 border-b-2 border-slate-100 pb-4">
                  <h4 className="text-[12px] font-black uppercase tracking-[0.25em] text-slate-900 italic">Detalle de Asistencia Mensual</h4>
               </div>
               
               <table className="w-full text-xs border-collapse table-fixed">
                 <thead>
                   <tr className="text-slate-400 border-b border-slate-200">
                     <th className="text-left py-4 font-black uppercase tracking-widest text-[9px] w-[18%]">Fecha</th>
                     <th className="text-center py-4 font-black uppercase tracking-widest text-[9px] w-[18%]">Categoría</th>
                     <th className="text-center py-4 font-black uppercase tracking-widest text-[9px] w-[16%]">H. Totales</th>
                     <th className="text-center py-4 font-black uppercase tracking-widest text-[9px] w-[16%]">H. Extras</th>
                     {hasFinancialData && <th className="text-right py-4 font-black uppercase tracking-widest text-[9px] w-[32%]">Bruto Estimado</th>}
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                   {sortedDays.map(day => {
                     const { gross, duration, extraHours } = getDayFinancials(day, summary.hourlyRate);
                     return (
                       <tr key={day.id} className="font-bold">
                         <td className="py-5 text-slate-700 text-[11px] tabular-nums">
                            {new Date(day.date + 'T00:00:00').toLocaleDateString('es-UY', { day: '2-digit', month: 'short' })}
                         </td>
                         <td className="py-5 text-center">
                            <span className={`text-[8px] px-3 py-1 rounded-full uppercase font-black border tracking-wider ${
                               day.type === 'work' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                               day.type === 'vacation' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                               'bg-slate-50 text-slate-600 border-slate-100'
                            }`}>{day.type}</span>
                         </td>
                         <td className="py-5 text-center text-slate-900 text-[11px] tabular-nums">{duration.toFixed(1)}h</td>
                         <td className="py-5 text-center text-blue-600 text-[11px] tabular-nums">{extraHours > 0 ? `+${extraHours.toFixed(1)}` : '—'}</td>
                         {hasFinancialData && <td className="py-5 text-right text-slate-900 text-[11px] tabular-nums">{formatCurrency(gross)}</td>}
                       </tr>
                     );
                   })}
                 </tbody>
               </table>
            </div>

            {/* Resumen Final de Cobro */}
            {hasFinancialData ? (
              <div className="space-y-8 bg-slate-900 text-white p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden border-t-[12px] border-blue-600">
                <div className="absolute top-0 right-0 p-10 opacity-[0.03] rotate-12">
                   <ShieldCheck className="w-56 h-56" />
                </div>
                
                <div className="grid grid-cols-2 gap-x-16 gap-y-5 relative z-10">
                   <div className="flex justify-between items-center text-sm border-b border-white/10 pb-3">
                     <span className="font-black uppercase tracking-[0.2em] text-[10px] opacity-60">Suma Total de Brutos</span>
                     <span className="font-black tabular-nums text-lg">{formatCurrency(summary.totalGross)}</span>
                   </div>
                   <div className="flex justify-between items-center text-sm border-b border-white/10 pb-3">
                     <span className="font-black uppercase tracking-[0.2em] text-[10px] text-rose-400">Montepío / Ley (22%)</span>
                     <span className="font-black text-rose-400 tabular-nums text-lg">-{formatCurrency(summary.bpsDiscount)}</span>
                   </div>
                   {summary.totalAdvances > 0 && (
                     <div className="flex justify-between items-center text-sm border-b border-white/10 pb-3">
                       <span className="font-black uppercase tracking-[0.2em] text-[10px] text-amber-400">Vales y Adelantos</span>
                       <span className="font-black text-amber-400 tabular-nums text-lg">-{formatCurrency(summary.totalAdvances)}</span>
                     </div>
                   )}
                   <div className="flex justify-between items-center text-sm border-b border-white/10 pb-3">
                     <span className="font-black uppercase tracking-[0.2em] text-[10px] text-emerald-400">Viáticos (No Gravados)</span>
                     <span className="font-black text-emerald-400 tabular-nums text-lg">+{formatCurrency(summary.totalAllowances)}</span>
                   </div>
                </div>
                
                <div className="flex justify-between items-end pt-12 mt-6 border-t border-white/5">
                  <div className="space-y-1">
                    <p className="font-black text-blue-400 uppercase tracking-[0.5em] text-[12px] italic">Líquido Estimado Final</p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest italic">Cálculo de referencia personal</p>
                  </div>
                  <span className="text-7xl font-black italic tracking-tighter leading-none text-white tabular-nums drop-shadow-lg">{formatCurrency(summary.netPay)}</span>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 p-12 rounded-[3.5rem] text-center border-2 border-dashed border-slate-200">
                 <p className="text-[12px] font-black uppercase text-slate-400 tracking-[0.4em] mb-4">Acumulado de Horas Netas</p>
                 <p className="text-7xl font-black italic text-slate-900 tabular-nums">
                    {(summary.totalNormalHours + summary.totalExtraHours).toFixed(1)} 
                    <span className="text-2xl ml-3 text-blue-600 uppercase">Horas</span>
                 </p>
              </div>
            )}

            {/* Pie de Página */}
            <div className="mt-16 pt-12 border-t-2 border-slate-50 flex justify-between items-end opacity-40">
              <div className="flex items-center gap-5">
                 <div className="w-14 h-14 border-2 border-slate-900 rounded-2xl flex items-center justify-center font-black text-lg italic bg-slate-50">RL</div>
                 <div className="space-y-1">
                    <p className="text-[11px] font-black text-slate-900 uppercase">Registro Laboral Uruguay</p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Documento Privado • v5.5 Professional</p>
                 </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Algoritmo de Cálculo Validado</p>
                <p className="text-[8px] font-bold text-slate-300 uppercase tracking-[0.3em]">Sujeto a aportes patronales según rubro</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* Optimizaciones para la exportación de imagen */
        #receipt-capture-area-pro table {
          table-layout: fixed !important;
          width: 100% !important;
        }
        #receipt-capture-area-pro .tabular-nums {
          font-variant-numeric: tabular-nums !important;
        }
        #receipt-capture-area-pro h1, 
        #receipt-capture-area-pro p, 
        #receipt-capture-area-pro span, 
        #receipt-capture-area-pro td, 
        #receipt-capture-area-pro th {
          -webkit-font-smoothing: antialiased !important;
          text-rendering: optimizeLegibility !important;
        }
        /* Eliminar scrollbars durante captura */
        .scrollbar-hide::-webkit-scrollbar {
          display: none !important;
        }
      `}</style>
    </div>
  );
};

export default Receipt;
