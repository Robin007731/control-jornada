
import React, { useState, useRef } from 'react';
import { UserSettings, Advance, WorkDay } from '../types';
import { formatCurrency } from '../utils';
import { Lock, Plus, Trash2, User, Wallet, Shield, AlertCircle, RefreshCw, Download, Upload, Check, Smartphone } from 'lucide-react';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === settings.passwordHash) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Contraseña incorrecta');
    }
  };

  const handleInstallApp = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      console.log(`User response to install: ${outcome}`);
    } else {
      alert('Para instalar en iOS: Toca el botón "Compartir" en Safari y luego "Añadir a pantalla de inicio".\n\nEn Android: Busca "Instalar aplicación" en el menú de Chrome.');
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
    link.download = `backup_registro_laboral_${new Date().toISOString().split('T')[0]}.json`;
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
          if (confirm('¿Restaurar estos datos? Se sobrescribirá la información actual.')) {
            localStorage.setItem('llavero_data', JSON.stringify(json));
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
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-gray-100 text-center">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Panel Protegido</h2>
          <p className="text-gray-500 mb-8 text-sm">Introduce la contraseña de seguridad para acceder a los ajustes.</p>
          <form onSubmit={handleAuth} className="space-y-4">
            <input 
              type="password" 
              placeholder="Contraseña (defecto: 1234)"
              className="w-full px-4 py-4 rounded-2xl border-2 border-gray-100 focus:border-blue-500 outline-none transition-all text-center text-xl font-bold tracking-widest"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              autoFocus
            />
            {error && <p className="text-red-500 text-sm font-semibold">{error}</p>}
            <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg active:scale-95">
              Desbloquear
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Ajustes</h2>
        <div className="flex items-center gap-3">
          {saveStatus && <span className="text-green-600 text-xs font-bold flex items-center gap-1 animate-pulse"><Check className="w-3 h-3" /> {saveStatus}</span>}
          <button onClick={() => setIsAuthenticated(false)} className="bg-gray-100 p-2 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"><Lock className="w-5 h-5" /></button>
        </div>
      </div>

      {/* Botón Descargar App */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-3xl shadow-lg text-white">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
            <Smartphone className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg">App en tu celular</h3>
            <p className="text-blue-100 text-xs">Acceso directo rápido y offline con el icono oficial.</p>
          </div>
        </div>
        <button 
          onClick={handleInstallApp}
          className="w-full mt-4 bg-white text-blue-600 py-3 rounded-2xl font-black uppercase tracking-wider shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Download className="w-5 h-5" /> Descargar App
        </button>
      </section>

      <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
        <div className="flex items-center gap-2 mb-2"><User className="text-blue-600 w-5 h-5" /><h3 className="font-bold">Perfil Laboral</h3></div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase ml-2 mb-1 block">Nombre Completo</label>
            <input type="text" value={settings.workerName} onChange={(e) => { setSettings(prev => ({ ...prev, workerName: e.target.value })); notifySave(); }} className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-all" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase ml-2 mb-1 block">Salario Nominal ($)</label>
            <input type="number" value={settings.monthlySalary} onChange={(e) => { setSettings(prev => ({ ...prev, monthlySalary: Number(e.target.value) })); notifySave(); }} className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-all" />
          </div>
        </div>
      </section>

      <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
        <div className="flex items-center gap-2 mb-2"><Wallet className="text-green-600 w-5 h-5" /><h3 className="font-bold">Adelantos</h3></div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input type="number" placeholder="Monto ($)" className="flex-1 px-4 py-3 rounded-xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-green-500" value={advAmount} onChange={(e) => setAdvAmount(e.target.value)} />
          <input type="text" placeholder="Nota" className="flex-1 px-4 py-3 rounded-xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-green-500" value={advNote} onChange={(e) => setAdvNote(e.target.value)} />
          <button onClick={handleAddAdv} className="bg-green-600 text-white p-3 px-6 rounded-xl font-bold flex items-center justify-center gap-2"><Plus className="w-5 h-5" /> Agregar</button>
        </div>
        <div className="space-y-2 mt-4 max-h-48 overflow-y-auto pr-2">
          {advances.map(adv => (
            <div key={adv.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div><span className="font-bold text-gray-700">{formatCurrency(adv.amount)}</span>{adv.note && <span className="ml-2 text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">{adv.note}</span>}</div>
              <button onClick={() => onDeleteAdvance(adv.id)} className="text-gray-300 hover:text-red-500 p-2"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
        <div className="flex items-center gap-2 mb-2"><Shield className="text-purple-600 w-5 h-5" /><h3 className="font-bold">Seguridad</h3></div>
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
          <div><p className="font-bold text-gray-700">Modo Simplificado</p><p className="text-xs text-gray-500">Sin descansos automáticos</p></div>
          <button onClick={() => { setSettings(prev => ({ ...prev, simplifiedMode: !prev.simplifiedMode })); notifySave(); }} className={`w-12 h-6 rounded-full transition-all relative ${settings.simplifiedMode ? 'bg-blue-600' : 'bg-gray-300'}`}><div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${settings.simplifiedMode ? 'left-7' : 'left-1'}`} /></button>
        </div>
        <div><label className="text-xs font-bold text-gray-400 uppercase ml-2 mb-1 block">Contraseña</label><input type="text" value={settings.passwordHash} onChange={(e) => { setSettings(prev => ({ ...prev, passwordHash: e.target.value })); notifySave(); }} className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-purple-500 font-bold tracking-widest text-center" /></div>
      </section>

      <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
        <div className="flex items-center gap-2 mb-2"><RefreshCw className="text-orange-500 w-5 h-5" /><h3 className="font-bold">Backup</h3></div>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={handleBackup} className="flex items-center justify-center gap-2 bg-orange-50 text-orange-600 p-4 rounded-2xl font-bold border border-orange-100 active:scale-95 transition-all"><Download className="w-5 h-5" /> Respaldar</button>
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 bg-blue-50 text-blue-600 p-4 rounded-2xl font-bold border border-blue-100 active:scale-95 transition-all"><Upload className="w-5 h-5" /> Restaurar</button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json" />
        </div>
      </section>

      <section className="bg-red-50 p-6 rounded-3xl border border-red-100 space-y-4">
        <h3 className="font-bold text-red-800 flex items-center gap-2 uppercase tracking-wider text-sm"><AlertCircle className="w-5 h-5" /> Peligro</h3>
        <button onClick={() => { if (confirm('¿BORRAR TODO?')) { localStorage.removeItem('llavero_data'); window.location.reload(); } }} className="w-full bg-red-600 text-white p-5 rounded-2xl font-bold active:scale-95 transition-all"><Trash2 className="w-5 h-5" /> Eliminar todos los datos</button>
      </section>
    </div>
  );
};

export default Settings;
