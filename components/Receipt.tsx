
import React, { useState, useRef } from 'react';
import { WorkDay, UserSettings, Advance } from '../types';
import { getSummary, formatCurrency, getDayFinancials } from '../utils';
import { Loader2, Check, ShieldCheck, FileText, Download, Award } from 'lucide-react';
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
    const element = document.getElementById('receipt-master-canvas');
    if (!element || isExporting) return;

    setIsExporting(true);
    
    try {
      // Configuramos el canvas para máxima calidad
      const canvas = await html2canvas(element, {
        scale: 4, // Multiplicador de resolución (4x para HD cristalino)
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 800, // Ancho fijo de documento profesional
        onclone: (clonedDoc) => {
          const el = clonedDoc.getElementById('receipt-master-canvas');
          if (el) {
            el.style.display = 'block';
            el.style.width = '800px';
            el.style.padding = '60px';
            el.style.borderRadius = '0';
          }
        }
      });

      // Convertimos a imagen y disparamos descarga
      const image = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      const safeName = settings.workerName.trim().replace(/\s+/g, '_');
      link.download = `Reporte_${safeName}_${new Date().toISOString().split('T')[0]}.png`;
      link.href = image;
      link.click();
      
      setExported(true);
      setTimeout(() => setExported(false), 3000);
    } catch (error) {
      console.error('Error de exportación:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-xl mx-auto pb-20">
      <div className="flex justify-between items-center px-4">
        <div>
          <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">Report Center</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Exportación HD Certificada</p>
        </div>
        <button 
          onClick={handleDownload}
          disabled={isExporting || sortedDays.length === 0}
          className={`flex items-center gap-3 px-6 py-4 rounded-[1.8rem] font-black text-[11px] uppercase tracking-widest shadow-2xl transition-all active:scale-95 disabled:opacity-50 ${
            exported ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white'
          }`}
        >
          {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : exported ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4 text-blue-400" />}
          {isExporting ? 'Procesando...' : exported ? 'Listo' : 'Generar PNG'}
        </button>
      </div>

      {sortedDays.length === 0 ? (
        <div className="bg-white p-20 rounded-[3rem] border-4 border-dashed border-slate-100 text-center space-y-5 mx-4">
          <div className="bg-slate-50 w-20 h-20 rounded-[2.5rem] flex items-center justify-center mx-auto text-slate-200">
             <FileText className="w-10 h-10" />
          </div>
          <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest leading-relaxed">No hay suficientes jornadas<br/>para un reporte detallado.</p>
        </div>
      ) : (
        <div className="mx-4 overflow-hidden rounded-[2.5rem] shadow-2xl border border-slate-100 bg-white shadow-slate-200/50">
          {/* Este contenedor es lo que el usuario ve, adaptado a su pantalla */}
          <div className="overflow-x-auto scrollbar-hide">
            <div 
              id="receipt-master-canvas" 
              className="bg-white p-10 text-slate-800"
              style={{ width: '800px', margin: '0 auto' }}
            >
              {/* Header de la App en el Reporte */}
              <div className="flex justify-between items-start border-b-[8px] border-slate-900 pb-10 mb-12">
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="bg-slate-900 p-3 rounded-2xl text-white shadow-xl rotate-3">
                      <ShieldCheck className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none text-slate-900">Informe Laboral</h1>
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.5em] mt-1">Llavpodes System</p>
                    </div>
                  </div>
                  <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.4em]">Control de Jornada • Estándar Uruguay</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-black text-slate-300 tracking-widest mb-1.5">Estatus</p>
                  <div className="bg-slate-900 text-white px-5 py-2 rounded-xl font-black text-[10px] uppercase tracking-tighter shadow-md inline-flex items-center gap-2">
                    <Award className="w-3 h-3 text-blue-400" /> Registro Validado
                  </div>
                </div>
              </div>

              {/* Información de Usuario y Empresa */}
              <div className="grid grid-cols-2 gap-16 mb-16">
                <div className="space-y-8">
                  <div className="max-w-xs">
                     <p className="text-[10px] uppercase font-black text-slate-400 mb-2.5 tracking-widest">Profesional Responsable</p>
                     <p className="font-black text-3xl text-slate-900 leading-tight uppercase italic tracking-tighter break-words tabular-nums">{settings.workerName}</p>
                  </div>
                  <div className="max-w-xs">
                     <p className="text-[10px] uppercase font-black text-slate-400 mb-2.5 tracking-widest">Establecimiento / Empresa</p>
                     <p className="font-black text-lg text-slate-600 leading-tight uppercase tracking-tight break-words">{settings.workplaceName || 'Gestión Independiente'}</p>
                  </div>
                </div>
                <div className="text-right space-y-8">
                  {hasFinancialData && (
                    <div>
                      <p className="text-[10px] uppercase font-black text-slate-400 mb-2.5 tracking-widest">Sueldo Nominal Acordado</p>
                      <p className="font-black text-3xl text-blue-600 leading-none italic tabular-nums">{formatCurrency(settings.monthlySalary)}</p>
                    </div>
                  )}
                  <div>
                     <p className="text-[10px] uppercase font-black text-slate-400 mb-2.5 tracking-widest">Período de Emisión</p>
                     <p className="font-black text-sm text-slate-500 uppercase tracking-widest tabular-nums">{new Date().toLocaleDateString('es-UY', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>
              </div>

              {/* Tabla de Actividad */}
              <div className="mb-16">
                 <div className="flex justify-between items-end mb-8 border-b-2 border-slate-100 pb-4">
                    <h4 className="text-[12px] font-black uppercase tracking-[0.3em] text-slate-900 italic">Cronograma de Asistencia</h4>
                 </div>
                 
                 <table className="w-full text-xs border-collapse table-fixed">
                   <thead>
                     <tr className="text-slate-400 border-b-2 border-slate-900">
                       <th className="text-left py-4 font-black uppercase tracking-widest text-[9px] w-[18%]">Día/Fecha</th>
                       <th className="text-center py-4 font-black uppercase tracking-widest text-[9px] w-[18%]">Tipo</th>
                       <th className="text-center py-4 font-black uppercase tracking-widest text-[9px] w-[16%]">H. Netas</th>
                       <th className="text-center py-4 font-black uppercase tracking-widest text-[9px] w-[16%]">Extras</th>
                       {hasFinancialData && <th className="text-right py-4 font-black uppercase tracking-widest text-[9px] w-[32%]">Bruto Estimado</th>}
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {sortedDays.map(day => {
                       const { gross, duration, extraHours } = getDayFinancials(day, summary.hourlyRate);
                       return (
                         <tr key={day.id} className="font-bold">
                           <td className="py-5 text-slate-800 text-[11px] tabular-nums">
                              {new Date(day.date + 'T00:00:00').toLocaleDateString('es-UY', { day: '2-digit', month: 'short' })}
                           </td>
                           <td className="py-5 text-center">
                              <span className={`text-[7px] px-3 py-1 rounded-full uppercase font-black border tracking-[0.15em] ${
                                 day.type === 'work' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                 day.type === 'vacation' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                 'bg-slate-50 text-slate-600 border-slate-100'
                              }`}>{day.type}</span>
                           </td>
                           <td className="py-5 text-center text-slate-900 text-[11px] tabular-nums">{duration.toFixed(1)}h</td>
                           <td className="py-5 text-center text-blue-600 text-[11px] tabular-nums">{extraHours > 0 ? `+${extraHours.toFixed(1)}` : '—'}</td>
                           {hasFinancialData && <td className="py-5 text-right text-slate-900 text-[11px] tabular-nums whitespace-nowrap overflow-hidden">{formatCurrency(gross)}</td>}
                         </tr>
                       );
                     })}
                   </tbody>
                 </table>
              </div>

              {/* Resumen de Cobro o de Tiempo */}
              {hasFinancialData ? (
                <div className="space-y-8 bg-slate-900 text-white p-12 rounded-[4rem] shadow-2xl relative overflow-hidden border-t-[14px] border-blue-600">
                  <div className="absolute top-0 right-0 p-10 opacity-[0.04] rotate-12 pointer-events-none">
                     <ShieldCheck className="w-64 h-64" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-x-20 gap-y-6 relative z-10">
                     <div className="flex justify-between items-center text-sm border-b border-white/10 pb-4">
                       <span className="font-black uppercase tracking-[0.2em] text-[10px] opacity-60 italic">Total Bruto Acumulado</span>
                       <span className="font-black tabular-nums text-lg">{formatCurrency(summary.totalGross)}</span>
                     </div>
                     <div className="flex justify-between items-center text-sm border-b border-white/10 pb-4">
                       <span className="font-black uppercase tracking-[0.2em] text-[10px] text-rose-400 italic">Deducción de Ley (22%)</span>
                       <span className="font-black text-rose-400 tabular-nums text-lg">-{formatCurrency(summary.bpsDiscount)}</span>
                     </div>
                     {summary.totalAdvances > 0 && (
                       <div className="flex justify-between items-center text-sm border-b border-white/10 pb-4">
                         <span className="font-black uppercase tracking-[0.2em] text-[10px] text-amber-400 italic">Vales / Adelantos</span>
                         <span className="font-black text-amber-400 tabular-nums text-lg">-{formatCurrency(summary.totalAdvances)}</span>
                       </div>
                     )}
                     <div className="flex justify-between items-center text-sm border-b border-white/10 pb-4">
                       <span className="font-black uppercase tracking-[0.2em] text-[10px] text-emerald-400 italic">Viáticos Acumulados</span>
                       <span className="font-black text-emerald-400 tabular-nums text-lg">+{formatCurrency(summary.totalAllowances)}</span>
                     </div>
                  </div>
                  
                  <div className="flex justify-between items-end pt-14 mt-6 border-t border-white/5 relative z-10">
                    <div className="space-y-1.5">
                      <p className="font-black text-blue-400 uppercase tracking-[0.6em] text-[14px] italic">Neto Líquido Estimado</p>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest italic">Cifra sujeta a ajustes oficiales de BPS</p>
                    </div>
                    <span className="text-7xl font-black italic tracking-tighter leading-none text-white tabular-nums drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">
                        {formatCurrency(summary.netPay)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 p-14 rounded-[4rem] text-center border-2 border-dashed border-slate-200">
                   <p className="text-[14px] font-black uppercase text-slate-400 tracking-[0.4em] mb-4 italic">Tiempo Total Computado</p>
                   <p className="text-8xl font-black italic text-slate-900 tabular-nums">
                      {(summary.totalNormalHours + summary.totalExtraHours).toFixed(1)} 
                      <span className="text-3xl ml-4 text-blue-600 uppercase">Horas</span>
                   </p>
                </div>
              )}

              {/* Disclaimer de la App */}
              <div className="mt-20 pt-12 border-t-4 border-slate-900 flex justify-between items-end">
                <div className="flex items-center gap-6">
                   <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center font-black text-2xl italic text-white shadow-xl">LLV</div>
                   <div className="space-y-1">
                      <p className="text-[12px] font-black text-slate-900 uppercase tracking-tight">Registro Laboral Autogestionado</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tecnología de Control Autónomo • Uruguay v5.5</p>
                   </div>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-900 mb-1 italic">Algoritmo de Cálculo Verificado</p>
                  <p className="text-[8px] font-bold text-slate-300 uppercase tracking-[0.3em]">Propiedad privada del trabajador</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* Eliminar scrollbars visuales pero mantener funcionalidad */
        .scrollbar-hide::-webkit-scrollbar {
          display: none !important;
        }
        
        #receipt-master-canvas {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        @media (max-width: 840px) {
          #receipt-master-canvas {
            transform: scale(${Math.min(1, (window.innerWidth - 32) / 800)});
            transform-origin: top left;
          }
        }
      `}</style>
    </div>
  );
};

export default Receipt;
