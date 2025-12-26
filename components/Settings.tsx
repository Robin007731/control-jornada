
import React, { useState, useRef } from 'react';
import { UserSettings, Advance, WorkDay } from '../types';
import { formatCurrency } from '../utils';
import { 
  Lock, Plus, Trash2, User, Wallet, Shield, AlertCircle, RefreshCw, 
  Download, Upload, Check, Smartphone, X, Apple, ChevronRight, 
  DownloadCloud, Video, PlayCircle, Loader2, Sparkles, Film, AlertTriangle, Database
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
  installPrompt: any;
}

const Settings: React.FC<SettingsProps> = ({ 
  settings, 
  setSettings, 
  advances, 
  onAddAdvance, 
  onDeleteAdvance,
  workDays,
  setWorkDays,
  installPrompt
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [error, setError] = useState('');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [advAmount, setAdvAmount] = useState('');
  const [advNote, setAdvNote] = useState('');
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const [confirmDeleteAllOpen, setConfirmDeleteAllOpen] = useState(false);
  const [confirmRestoreOpen, setConfirmRestoreOpen] = useState(false);
  const [pendingRestoreData, setPendingRestoreData] = useState<any>(null);
  
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
    setSaveStatus('Guardado');
    setTimeout(() => setSaveStatus(null), 2000);
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
    link.download = `backup_llavpodes_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.workDays && json.settings) {
          setPendingRestoreData(json);
          setConfirmRestoreOpen(true);
        }
      } catch (err) { alert('Archivo inválido'); }
    };
    reader.readAsText(file);
  };

  const performRestore = () => {
    if (pendingRestoreData) {
      localStorage.setItem('llavpodes_data', JSON.stringify(pendingRestoreData));
      window.location.reload();
    }
  };

  const performDeleteAll = () => {
    localStorage.removeItem('llavpodes_data');
    window.location.reload();
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6">
        <div className="bg-white p-8 rounded-[40px] shadow-2xl w-full max-w-md border border-gray-100 text-center space-y-6 animate-slide-up">
          <div className="bg-slate-900 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto shadow-xl">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight italic">Acceso Llavpodes</h2>
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1">Ingresa tu código de seguridad</p>
          </div>
          <form onSubmit={handleAuth} className="space-y-4">
            <input 
              type="password" 
              placeholder="Pin"
              className="w-full px-4 py-5 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-500 outline-none transition-all text-center text-3xl font-black tracking-[0.5em] text-slate-800"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              autoFocus
            />
            {error && <p className="text-red-500 text-xs font-bold uppercase">{error}</p>}
            <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all">Desbloquear</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center px-1">
        <h2 className="text-xl font-black italic uppercase tracking-tighter">Ajustes</h2>
        <div className="flex items-center gap-3">
          {saveStatus && <span className="text-green-600 text-[9px] font-black uppercase flex items-center gap-1 animate-pulse"><Check className="w-3 h-3" /> {saveStatus}</span>}
          <button onClick={() => setIsAuthenticated(false)} className="bg-slate-100 p-2 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"><Lock className="w-5 h-5" /></button>
        </div>
      </div>

      <section className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-4">
        <div className="flex items-center gap-2 mb-2"><User className="text-blue-500 w-5 h-5" /><h3 className="font-bold text-sm uppercase tracking-tight">Perfil Laboral</h3></div>
        <div className="space-y-4">
          <div>
            <label className="text-[9px] font-bold text-slate-400 uppercase ml-1 mb-1 block tracking-widest">Nombre del Trabajador/a</label>
            <input type="text" value={settings.workerName} onChange={(e) => { setSettings(prev => ({ ...prev, workerName: e.target.value })); notifySave(); }} className="w-full px-4 py-3 rounded-xl bg-slate-50 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all border-none" />
          </div>
          <div>
            <label className="text-[9px] font-bold text-slate-400 uppercase ml-1 mb-1 block tracking-widest">Salario Nominal Mensual ($)</label>
            <input type="number" value={settings.monthlySalary} onChange={(e) => { setSettings(prev => ({ ...prev, monthlySalary: Number(e.target.value) })); notifySave(); }} className="w-full px-4 py-3 rounded-xl bg-slate-50 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all border-none" />
          </div>
        </div>
      </section>

      <section className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-4">
        <div className="flex items-center gap-2 mb-2"><Wallet className="text-emerald-500 w-5 h-5" /><h3 className="font-bold text-sm uppercase tracking-tight">Adelantos</h3></div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input type="number" placeholder="Monto" className="flex-1 px-4 py-3 rounded-xl bg-slate-50 font-bold border-none outline-none" value={advAmount} onChange={(e) => setAdvAmount(e.target.value)} />
          <input type="text" placeholder="Nota" className="flex-1 px-4 py-3 rounded-xl bg-slate-50 font-bold border-none outline-none" value={advNote} onChange={(e) => setAdvNote(e.target.value)} />
          <button onClick={handleAddAdv} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all">Agregar</button>
        </div>
      </section>

      <section className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-4">
        <div className="flex items-center gap-2 mb-2"><RefreshCw className="text-orange-500 w-5 h-5" /><h3 className="font-bold text-sm uppercase tracking-tight">Backup de Seguridad</h3></div>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={handleBackup} className="flex items-center justify-center gap-2 bg-slate-900 text-white p-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all"><Download className="w-4 h-4" /> Exportar</button>
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 bg-blue-50 text-blue-600 p-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-blue-100 active:scale-95 transition-all"><Upload className="w-4 h-4" /> Importar</button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json" />
        </div>
      </section>

      <section className="p-4 mb-10">
        <button onClick={() => setConfirmDeleteAllOpen(true)} className="w-full bg-red-50 text-red-600 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] border border-red-100/50 hover:bg-red-100 transition-all flex items-center justify-center gap-2">
          <Trash2 className="w-4 h-4" /> Borrar Toda la Información Local
        </button>
      </section>

      <Modal isOpen={confirmDeleteAllOpen} onClose={() => setConfirmDeleteAllOpen(false)} title="Eliminar Base de Datos">
        <div className="space-y-6 text-center">
          <div className="bg-red-50 w-20 h-20 rounded-[2.5rem] flex items-center justify-center mx-auto text-red-600 shadow-inner"><AlertTriangle className="w-10 h-10" /></div>
          <h4 className="font-black text-slate-900 uppercase tracking-tight text-lg">¿Estás Seguro?</h4>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Esta acción borrará permanentemente todos tus registros de este dispositivo.</p>
          <div className="flex flex-col gap-3">
            <button onClick={performDeleteAll} className="w-full bg-red-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">Sí, eliminar todo</button>
            <button onClick={() => setConfirmDeleteAllOpen(false)} className="w-full bg-slate-50 text-slate-400 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px]">Cancelar</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={confirmRestoreOpen} onClose={() => setConfirmRestoreOpen(false)} title="Restaurar Copia">
        <div className="space-y-6 text-center">
          <div className="bg-blue-50 w-20 h-20 rounded-[2.5rem] flex items-center justify-center mx-auto text-blue-600 shadow-inner"><Database className="w-10 h-10" /></div>
          <h4 className="font-black text-slate-900 uppercase tracking-tight text-lg">¿Sobrescribir Datos?</h4>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Los datos actuales serán reemplazados por la copia de seguridad.</p>
          <div className="flex flex-col gap-3">
            <button onClick={performRestore} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">Restaurar ahora</button>
            <button onClick={() => setConfirmRestoreOpen(false)} className="w-full bg-slate-50 text-slate-400 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px]">Cancelar</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Settings;
