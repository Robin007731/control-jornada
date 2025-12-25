
import React from 'react';
import { WorkDay, UserSettings, Advance } from '../types';
import { getSummary, formatCurrency, getDayFinancials } from '../utils';
import { Download, Share2 } from 'lucide-react';

interface ReceiptProps {
  workDays: WorkDay[];
  settings: UserSettings;
  advances: Advance[];
}

const Receipt: React.FC<ReceiptProps> = ({ workDays, settings, advances }) => {
  const summary = getSummary(workDays, settings, advances);
  
  // Group days by month/year for range
  const sortedDays = [...workDays].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const dateRange = sortedDays.length > 0 
    ? `${new Date(sortedDays[0].date).toLocaleDateString('es-UY')} - ${new Date(sortedDays[sortedDays.length - 1].date).toLocaleDateString('es-UY')}`
    : 'N/A';

  const handleDownload = () => {
    // In a browser environment, we could use html2canvas to save the div as PNG
    alert('Función de exportación como PNG requiere librería externa (html2canvas). Se ha generado la visualización.');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Recibo de Sueldo</h2>
        <button 
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-md hover:bg-blue-700 transition-all"
        >
          <Share2 className="w-4 h-4" /> Exportar PNG
        </button>
      </div>

      <div id="receipt-container" className="bg-white p-8 rounded-none sm:rounded-3xl shadow-lg border border-gray-100 max-w-2xl mx-auto text-gray-800">
        <div className="border-b-2 border-blue-600 pb-6 mb-6 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-black text-blue-600 uppercase tracking-tighter italic">Registro laboral</h1>
            <p className="text-xs font-bold text-gray-400">CONTROL DE JORNADA LABORAL</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase font-bold text-gray-400">Período</p>
            <p className="font-bold text-sm">{dateRange}</p>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-8">
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Trabajador</p>
            <p className="font-bold text-lg">{settings.workerName}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Fecha de Emisión</p>
            <p className="font-semibold">{new Date().toLocaleDateString('es-UY')}</p>
          </div>
        </div>

        <table className="w-full text-xs mb-8">
          <thead className="border-b border-gray-200">
            <tr>
              <th className="text-left py-2 font-bold uppercase text-gray-400">Día</th>
              <th className="text-center py-2 font-bold uppercase text-gray-400">Normales</th>
              <th className="text-center py-2 font-bold uppercase text-gray-400">Extras</th>
              <th className="text-right py-2 font-bold uppercase text-gray-400">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sortedDays.map(day => {
              const { gross, normalHours, extraHours } = getDayFinancials(day, summary.hourlyRate);
              return (
                <tr key={day.id}>
                  <td className="py-2 font-medium">{new Date(day.date).toLocaleDateString('es-UY', { day: '2-digit', month: 'short' })}</td>
                  <td className="py-2 text-center">{normalHours.toFixed(1)}h</td>
                  <td className="py-2 text-center">{extraHours > 0 ? `${extraHours.toFixed(1)}h` : '-'}</td>
                  <td className="py-2 text-right font-semibold">{formatCurrency(gross)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="space-y-2 border-t border-gray-100 pt-6">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Total Bruto</span>
            <span className="font-bold">{formatCurrency(summary.totalGross)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Aportes BPS (22%)</span>
            <span className="font-bold text-red-500">-{formatCurrency(summary.bpsDiscount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Adelantos</span>
            <span className="font-bold text-red-500">-{formatCurrency(summary.totalAdvances)}</span>
          </div>
          <div className="flex justify-between text-xl font-black pt-4 border-t-2 border-gray-200 mt-4 text-blue-700 uppercase italic">
            <span>Líquido a cobrar</span>
            <span>{formatCurrency(summary.netPay)}</span>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-[10px] text-gray-400 font-medium italic">
            Este es un documento de uso interno generado por Registro laboral para el seguimiento de la jornada.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Receipt;
