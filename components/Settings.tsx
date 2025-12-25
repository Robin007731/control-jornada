
import React, { useState, useRef } from 'react';
import { UserSettings, Advance, WorkDay } from '../types';
import { formatCurrency } from '../utils';
import { Lock, Plus, Trash2, User, Wallet, Shield, AlertCircle, RefreshCw, Download, Upload, Check, Smartphone, X, Apple, ChevronRight, DownloadCloud } from 'lucide-react';
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

  const handleInstallApp = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      console.log(`User response to install: ${outcome}`);
    } else {
      setShowInstallHelp(true);
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
          if (confirm('¿Restaurar estos datos? Se sobrescribirá todo.')) {
            localStorage.setItem('llavpodes_data', JSON.stringify(json));
            window.location.reload();
          }
        }
      } catch (err) { alert('Error al leer el archivo.'); }
    };
    reader.readAsText(file);
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6">
        <div className="bg-white p-8 rounded-[40px] shadow-2xl w-full max-w-md border border-gray-100 text-center space-y-6">
          <div className="bg-slate-900 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto shadow-xl">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight">Acceso Privado</h2>
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1">Introduce tu pin de seguridad</p>
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
            <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all">
              Desbloquear Panel
            </button>
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

      {/* Bloque APK / PWA */}
      <section className="bg-slate-900 p-6 rounded-[32px] shadow-2xl text-white relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <Smartphone className="w-32 h-32 rotate-12" />
        </div>
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-500/20">
              <DownloadCloud className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-lg uppercase tracking-tight italic">Versión Standalone</h3>
              <p className="text-slate-400 text-[8px] font-bold uppercase tracking-[0.2em]">Experiencia APK • Acceso Directo</p>
            </div>
          </div>
          <button 
            onClick={handleInstallApp}
            className="w-full bg-white text-slate-900 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-blue-50"
          >
            {installPrompt ? 'Instalar Ahora' : 'Descargar Aplicación'}
          </button>
          <p className="text-[9px] text-center text-slate-500 font-black uppercase tracking-widest italic italic">
            Usa Llavpodes como una app real sin barra de navegador
          </p>
        </div>
      </section>

      <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
        <div className="flex items-center gap-2 mb-2"><User className="text-blue-500 w-5 h-5" /><h3 className="font-bold text-sm uppercase tracking-tight">Perfil Laboral</h3></div>
        <div className="space-y-4">
          <div>
            <label className="text-[9px] font-bold text-slate-400 uppercase ml-1 mb-1 block tracking-widest">Nombre del Trabajador/a</label>
            <input type="text" value={settings.workerName} onChange={(e) => { setSettings(prev => ({ ...prev, workerName: e.target.value })); notifySave(); }} className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 transition-all" />
          </div>
          <div>
            <label className="text-[9px] font-bold text-slate-400 uppercase ml-1 mb-1 block tracking-widest">Salario Nominal Mensual ($)</label>
            <input type="number" value={settings.monthlySalary} onChange={(e) => { setSettings(prev => ({ ...prev, monthlySalary: Number(e.target.value) })); notifySave(); }} className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 transition-all" />
          </div>
        </div>
      </section>

      <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
        <div className="flex items-center gap-2 mb-2"><Wallet className="text-emerald-500 w-5 h-5" /><h3 className="font-bold text-sm uppercase tracking-tight">Adelantos</h3></div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input type="number" placeholder="Monto ($)" className="flex-1 px-4 py-3 rounded-xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-emerald-500 font-bold" value={advAmount} onChange={(e) => setAdvAmount(e.target.value)} />
          <input type="text" placeholder="Nota" className="flex-1 px-4 py-3 rounded-xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-emerald-500 font-bold" value={advNote} onChange={(e) => setAdvNote(e.target.value)} />
          <button onClick={handleAddAdv} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all">Agregar</button>
        </div>
        <div className="space-y-2 mt-4 max-h-48 overflow-y-auto pr-2 scrollbar-hide">
          {advances.map(adv => (
            <div key={adv.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100 animate-in slide-in-from-right-2">
              <div><span className="font-black text-slate-700 text-sm">{formatCurrency(adv.amount)}</span>{adv.note && <span className="ml-2 text-[9px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase font-black italic">{adv.note}</span>}</div>
              <button onClick={() => onDeleteAdvance(adv.id)} className="text-slate-300 hover:text-red-500 p-2"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
        <div className="flex items-center gap-2 mb-2"><Shield className="text-purple-500 w-5 h-5" /><h3 className="font-bold text-sm uppercase tracking-tight">Seguridad</h3></div>
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <div><p className="font-black text-slate-800 text-xs">Modo Simplificado</p><p className="text-[10px] text-slate-400 font-bold">Sin descansos automáticos</p></div>
          <button onClick={() => { setSettings(prev => ({ ...prev, simplifiedMode: !prev.simplifiedMode })); notifySave(); }} className={`w-12 h-6 rounded-full transition-all relative ${settings.simplifiedMode ? 'bg-blue-600' : 'bg-slate-300'}`}><div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${settings.simplifiedMode ? 'left-7' : 'left-1'}`} /></button>
        </div>
        <div><label className="text-[9px] font-bold text-slate-400 uppercase ml-1 mb-1 block tracking-widest">Pin de acceso</label><input type="text" value={settings.passwordHash} onChange={(e) => { setSettings(prev => ({ ...prev, passwordHash: e.target.value })); notifySave(); }} className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-purple-500 font-black tracking-[0.4em] text-center" /></div>
      </section>

      <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
        <div className="flex items-center gap-2 mb-2"><RefreshCw className="text-orange-500 w-5 h-5" /><h3 className="font-bold text-sm uppercase tracking-tight">Backup</h3></div>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={handleBackup} className="flex items-center justify-center gap-2 bg-slate-900 text-white p-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all"><Download className="w-4 h-4" /> Respaldar</button>
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 bg-blue-50 text-blue-600 p-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-blue-100 active:scale-95 transition-all"><Upload className="w-4 h-4" /> Restaurar</button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json" />
        </div>
      </section>

      <section className="p-4 mb-10">
        <button onClick={() => { if (confirm('¿ESTÁS SEGURO? Se borrarán todos tus registros permanentemente.')) { localStorage.removeItem('llavpodes_data'); window.location.reload(); } }} className="w-full bg-red-50 text-red-600 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] border border-red-100/50 hover:bg-red-100 transition-all flex items-center justify-center gap-2">
          <Trash2 className="w-4 h-4" /> Borrar toda la información
        </button>
        <div className="text-center mt-8 opacity-20">
          <p className="text-[7px] font-black uppercase tracking-[0.5em] italic">Llavpodes Professional v2.5.0</p>
          <p className="text-[6px] font-black uppercase tracking-widest mt-1">Nexa Studio • Uruguay</p>
        </div>
      </section>

      <Modal isOpen={showInstallHelp} onClose={() => setShowInstallHelp(false)} title="Instalar Llavpodes">
        <div className="space-y-6 text-slate-800">
          <p className="text-sm font-bold leading-relaxed">Sigue estos pasos para instalar <span className="text-blue-600">Llavpodes</span> como una aplicación en tu dispositivo:</p>
          
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
             <div className="flex items-center gap-3">
                <Apple className="w-5 h-5" />
                <h4 className="font-black text-xs uppercase">En iOS (iPhone/iPad)</h4>
             </div>
             <ol className="text-xs font-bold text-slate-500 space-y-2">
                <li>1. Toca el botón <span className="bg-white px-2 py-0.5 rounded border">Compartir</span> (cuadrado con flecha).</li>
                <li>2. Desliza y selecciona <span className="text-blue-600">"Añadir a pantalla de inicio"</span>.</li>
                <li>3. Pulsa "Añadir". ¡Listo!</li>
             </ol>
          </div>

          <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 space-y-4">
             <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-blue-600" />
                <h4 className="font-black text-xs uppercase text-blue-600">En Android / Chrome</h4>
             </div>
             <ol className="text-xs font-bold text-blue-600/70 space-y-2">
                <li>1. Toca los tres puntos <span className="font-black">⋮</span> del navegador.</li>
                <li>2. Selecciona <span className="font-black">"Instalar aplicación"</span>.</li>
                <li>3. Confirma la instalación y aparecerá tu icono.</li>
             </ol>
          </div>

          <button onClick={() => setShowInstallHelp(false)} className="w-full bg-slate-900 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs">Entendido</button>
        </div>
      </Modal>
    </div>
  );
};

export default Settings;
