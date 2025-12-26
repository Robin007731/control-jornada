
import React, { useState, useRef } from 'react';
import { UserSettings, Advance, WorkDay } from '../types';
import { formatCurrency } from '../utils';
import { 
  Lock, Plus, Trash2, User, Wallet, RefreshCw, 
  Download, Upload, Check, Database, Briefcase, ChevronRight
} from 'lucide-react';
import Modal from './Modal';

interface SettingsProps {
  settings: UserSettings;
  setSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
  advances: Advance[];
  onAddAdvance: (adv: Advance) => void;
  onDeleteAdvance: (id: string) => void;
  workDays: WorkDay[];
  setWorkDays: React.Dispatch<React.SetStateAction<WorkDay[]>>;
}

const Settings: React.FC<SettingsProps> = ({ 
  settings, 
  setSettings, 
  advances, 
  onAddAdvance, 
  onDeleteAdvance,
  workDays,
  setWorkDays,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [error, setError] = useState('');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [advAmount, setAdvAmount] = useState('');
  const [advNote, setAdvNote] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === settings.passwordHash) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Pin incorrecto');
    }
  };

  const notifySave = () => {
    setSaveStatus('Configuración Actualizada');
    setTimeout(() => setSaveStatus(null), 2500);
  };

  const handleAddAdv = () => {
    const amount = parseFloat(advAmount);
    if (!advAmount || isNaN(amount) || amount <= 0) return;
    onAddAdvance({
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      amount: amount,
      note: advNote
    });
    setAdvAmount('');
    setAdvNote('');
  };

  const handleBackup = () => {
    const data = { workDays, advances, settings };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_llavpodes_pro_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 animate-in fade-in zoom-in duration-500">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-md border border-slate-100 text-center space-y-8">
          <div className="bg-slate-900 w-20 h-20 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl rotate-3">
            <Lock className="w-10 h-10 text-blue-400" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black uppercase tracking-tighter italic text-slate-900">Security Gate</h2>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em]">Autenticación de Propietario</p>
          </div>
          <form onSubmit={handleAuth} className="space-y-6">
            <input 
              type="password" 
              placeholder="••••"
              className="w-full px-6 py-6 rounded-3xl bg-slate-50 border-2 border-transparent focus:border-blue-600 outline-none transition-all text-center text-4xl font-black tracking-[1em] text-slate-800 shadow-inner"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              autoFocus
            />
            {error && <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest animate-bounce">{error}</p>}
            <button className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all hover:bg-black">Desbloquear Panel</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
      <div className="flex justify-between items-center px-2">
        <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900">Panel de Control</h2>
        <div className="flex items-center gap-3">
          {saveStatus && <span className="text-emerald-600 text-[9px] font-black uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 animate-fade-in">{saveStatus}</span>}
          <button onClick={() => setIsAuthenticated(false)} className="bg-white border border-slate-100 p-2.5 rounded-2xl text-slate-400 hover:text-slate-900 transition-all shadow-sm"><Lock className="w-5 h-5" /></button>
        </div>
      </div>

      <section className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
           <Briefcase className="text-blue-600 w-6 h-6" />
           <h3 className="font-black text-sm uppercase tracking-widest italic text-slate-800">Perfil del Profesional</h3>
        </div>
        <div className="space-y-5">
          <InputGroup label="Nombre del Profesional" value={settings.workerName} onChange={(val) => { setSettings(s => ({...s, workerName: val})); notifySave(); }} />
          <InputGroup label="Lugar de Trabajo / Empresa" value={settings.workplaceName} placeholder="Ej: Nexa Studio S.A." onChange={(val) => { setSettings(s => ({...s, workplaceName: val})); notifySave(); }} />
          <InputGroup label="Sueldo Nominal Mensual ($)" type="number" value={settings.monthlySalary} onChange={(val) => { setSettings(s => ({...s, monthlySalary: Number(val)})); notifySave(); }} />
        </div>
      </section>

      <section className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
           <Wallet className="text-emerald-600 w-6 h-6" />
           <h3 className="font-black text-sm uppercase tracking-widest italic text-slate-800">Gestión de Adelantos</h3>
        </div>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
             <input type="number" placeholder="Monto" className="px-5 py-4 rounded-2xl bg-slate-50 font-bold text-sm outline-none border-none shadow-inner" value={advAmount} onChange={(e) => setAdvAmount(e.target.value)} />
             <input type="text" placeholder="Concepto" className="px-5 py-4 rounded-2xl bg-slate-50 font-bold text-sm outline-none border-none shadow-inner" value={advNote} onChange={(e) => setAdvNote(e.target.value)} />
          </div>
          <button onClick={handleAddAdv} className="bg-emerald-600 text-white w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-900/10 active:scale-95 transition-all">Registrar Adelanto</button>
        </div>
      </section>

      <section className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
           <RefreshCw className="text-indigo-600 w-6 h-6" />
           <h3 className="font-black text-sm uppercase tracking-widest italic text-slate-800">Integridad de Datos</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ActionButton onClick={handleBackup} icon={<Download />} label="Exportar Backup" color="bg-slate-900" />
          <ActionButton onClick={() => fileInputRef.current?.click()} icon={<Upload />} label="Restaurar Backup" color="bg-blue-600" />
          <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={(e) => {
             const file = e.target.files?.[0];
             if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                   try {
                      const json = JSON.parse(ev.target?.result as string);
                      localStorage.setItem('llavpodes_data_pro', JSON.stringify(json));
                      window.location.reload();
                   } catch(err) { alert('Error en el archivo'); }
                };
                reader.readAsText(file);
             }
          }} />
        </div>
      </section>
    </div>
  );
};

const InputGroup = ({ label, value, onChange, type = "text", placeholder = "" }: { label: string, value: any, onChange: (val: string) => void, type?: string, placeholder?: string }) => (
  <div>
    <label className="text-[9px] font-black text-slate-400 uppercase ml-2 mb-2 block tracking-widest">{label}</label>
    <input 
      type={type} 
      placeholder={placeholder}
      value={value} 
      onChange={(e) => onChange(e.target.value)} 
      className="w-full px-5 py-4 rounded-2xl bg-slate-50 font-bold text-slate-700 outline-none border-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner" 
    />
  </div>
);

const ActionButton = ({ onClick, icon, label, color }: { onClick: () => void, icon: React.ReactNode, label: string, color: string }) => (
  <button 
    onClick={onClick} 
    className={`${color} text-white flex items-center justify-center gap-3 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all`}
  >
    {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-4 h-4' })}
    {label}
  </button>
);

export default Settings;
