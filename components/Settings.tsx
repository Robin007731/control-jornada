
import React, { useState, useRef } from 'react';
import { UserSettings, Advance, WorkDay } from '../types';
import { 
  Lock, Plus, Trash2, Wallet, RefreshCw, 
  Download, Upload, Briefcase, 
  Trash, Bell, BellOff, Volume2, ShieldCheck, Eye, EyeOff, Clock, ShieldAlert, Key, Percent
} from 'lucide-react';
import Modal from './Modal';
// Added missing utility import
import { formatCurrency } from '../utils';

interface SettingsProps {
  settings: UserSettings;
  setSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
  advances: Advance[];
  onAddAdvance: (adv: Advance) => void;
  onDeleteAdvance: (id: string) => void;
  workDays: WorkDay[];
  setWorkDays: React.Dispatch<React.SetStateAction<WorkDay[]>>;
  onTestSound: () => void;
}

const Settings: React.FC<SettingsProps> = ({ 
  settings, 
  setSettings, 
  advances, 
  onAddAdvance, 
  onDeleteAdvance,
  workDays,
  setWorkDays,
  onTestSound
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [error, setError] = useState('');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [advAmount, setAdvAmount] = useState('');
  const [advNote, setAdvNote] = useState('');
  
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [newPin, setNewPin] = useState('');

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

  const toggleNotifications = async () => {
    if (!settings.notificationsEnabled) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setSettings(s => ({ ...s, notificationsEnabled: true }));
        onTestSound();
        notifySave();
      } else {
        alert("Para activar recordatorios debes permitir las notificaciones en tu navegador.");
      }
    } else {
      setSettings(s => ({ ...s, notificationsEnabled: false }));
      notifySave();
    }
  };

  const togglePrivacyMode = () => {
    setSettings(s => ({ ...s, privacyMode: !s.privacyMode }));
    notifySave();
  };

  const handleStandardHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setSettings(s => ({ ...s, standardJornadaHours: val }));
    notifySave();
  };

  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length < 4) {
      alert("El PIN debe tener al menos 4 caracteres.");
      return;
    }
    setSettings(s => ({ ...s, passwordHash: newPin }));
    setIsPinModalOpen(false);
    setNewPin('');
    notifySave();
    alert("PIN actualizado correctamente.");
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
    link.download = `backup_laboral_pro_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const clearSystemCache = () => {
    if (confirm("Esto limpiará la memoria técnica para corregir errores visuales. ¿Continuar?")) {
      window.location.reload();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 animate-in fade-in zoom-in duration-500">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-md border border-slate-100 text-center space-y-8">
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500 pb-12">
      <div className="flex justify-between items-center px-2">
        <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900">Panel de Control</h2>
        <div className="flex items-center gap-3">
          {saveStatus && <span className="text-emerald-600 text-[9px] font-black uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 animate-fade-in">{saveStatus}</span>}
          <button onClick={() => setIsAuthenticated(false)} className="bg-white border border-slate-100 p-2.5 rounded-2xl text-slate-400 hover:text-slate-900 transition-all shadow-sm"><Lock className="w-5 h-5" /></button>
        </div>
      </div>

      {/* Preferencias de Sistema */}
      <section className="bg-slate-900 p-8 rounded-[3rem] shadow-xl space-y-8 text-white overflow-hidden relative border border-white/5">
        <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 pointer-events-none">
           <ShieldCheck className="w-48 h-48" />
        </div>
        
        <div className="flex items-center gap-3 border-b border-white/10 pb-4 relative z-10">
           <ShieldCheck className="text-blue-400 w-6 h-6" />
           <h3 className="font-black text-sm uppercase tracking-widest italic">Preferencias Avanzadas</h3>
        </div>

        <div className="space-y-6 relative z-10">
          {/* Jornada Estándar Slider */}
          <div className="bg-white/5 border border-white/10 p-5 rounded-[2rem] space-y-4">
             <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-indigo-500 rounded-xl text-white">
                   <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest">Jornada Estándar</p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest italic">Define el corte para horas extras</p>
                </div>
             </div>
             <div className="flex items-center gap-6">
                <input 
                  type="range" 
                  min="4" 
                  max="12" 
                  step="1" 
                  value={settings.standardJornadaHours} 
                  onChange={handleStandardHoursChange}
                  className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <span className="text-xl font-black italic tabular-nums w-10">{settings.standardJornadaHours}h</span>
             </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* Control de Modo Privacidad */}
            <div className="bg-white/5 border border-white/10 p-5 rounded-[2rem] flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${settings.privacyMode ? 'bg-emerald-600' : 'bg-slate-700'}`}>
                    {settings.privacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest">Modo Privacidad</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Ocultar montos en el Dashboard</p>
                  </div>
                </div>
                <button 
                  onClick={togglePrivacyMode}
                  className={`w-12 h-6 rounded-full transition-colors relative ${settings.privacyMode ? 'bg-emerald-600' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.privacyMode ? 'left-7' : 'left-1'}`} />
                </button>
            </div>

            {/* Control de Notificaciones */}
            <div className="bg-white/5 border border-white/10 p-5 rounded-[2rem] space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${settings.notificationsEnabled ? 'bg-blue-600' : 'bg-slate-700'}`}>
                    {settings.notificationsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest">Recordatorios</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest italic">Avisar al cumplir jornada</p>
                  </div>
                </div>
                <button 
                  onClick={toggleNotifications}
                  className={`w-12 h-6 rounded-full transition-colors relative ${settings.notificationsEnabled ? 'bg-blue-600' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.notificationsEnabled ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
              {settings.notificationsEnabled && (
                <button 
                  onClick={onTestSound}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/20 transition-all"
                >
                  <Volume2 className="w-3.5 h-3.5" /> Probar Sonido Aura
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setIsPinModalOpen(true)}
                className="bg-white/5 border border-white/10 py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
              >
                <Key className="w-3 h-3 text-amber-400" /> Cambiar PIN
              </button>
              <button 
                onClick={clearSystemCache}
                className="bg-white/5 border border-white/10 py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
              >
                <RefreshCw className="w-3 h-3 text-blue-400" /> Reset Cache
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Perfil */}
      <section className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
           <Briefcase className="text-blue-600 w-6 h-6" />
           <h3 className="font-black text-sm uppercase tracking-widest italic text-slate-800">Perfil del Profesional</h3>
        </div>
        <div className="space-y-5">
          <InputGroup label="Nombre del Profesional" value={settings.workerName} onChange={(val) => { setSettings(s => ({...s, workerName: val})); notifySave(); }} />
          <InputGroup label="Lugar de Trabajo / Empresa" value={settings.workplaceName} placeholder="Ej: Nexa Studio S.A." onChange={(val) => { setSettings(s => ({...s, workplaceName: val})); notifySave(); }} />
          <InputGroup label="Sueldo Nominal Mensual ($)" type="number" value={settings.monthlySalary} onChange={(val) => { setSettings(s => ({...s, monthlySalary: Number(val)})); notifySave(); }} />
          
          {/* Nuevo control para BPS */}
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 mt-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
                <Percent className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">Descuento de Ley (BPS/Otros)</p>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest italic">Aportes jubilatorios y salud</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <input 
                type="range" 
                min="0" 
                max="50" 
                step="0.5" 
                value={settings.bpsRate} 
                onChange={(e) => { setSettings(s => ({ ...s, bpsRate: parseFloat(e.target.value) })); notifySave(); }}
                className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <span className="text-xl font-black italic tabular-nums w-12 text-blue-600">{settings.bpsRate}%</span>
            </div>
          </div>
        </div>
      </section>

      {/* Adelantos */}
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
          
          {advances.length > 0 && (
            <div className="pt-4 space-y-2">
              <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-2">Últimos Adelantos</p>
              {advances.slice(-3).reverse().map(adv => (
                <div key={adv.id} className="flex justify-between items-center bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                  <div>
                    <p className="text-[10px] font-black text-slate-800">{adv.note || 'Sin concepto'}</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase">{new Date(adv.date).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-black text-rose-500">-{formatCurrency(adv.amount, settings.privacyMode)}</span>
                    <button onClick={() => onDeleteAdvance(adv.id)} className="text-slate-300 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Backup */}
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

      {/* Modal Cambiar PIN */}
      <Modal isOpen={isPinModalOpen} onClose={() => setIsPinModalOpen(false)} title="Seguridad: Cambiar PIN">
        <form onSubmit={handleChangePin} className="space-y-6">
          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-3 mb-4">
             <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
             <p className="text-[9px] font-bold text-amber-800 uppercase leading-relaxed">Este PIN protege el acceso a tu Panel de Control y reportes. No lo compartas con nadie.</p>
          </div>
          <InputGroup 
            label="Nuevo PIN de Acceso" 
            type="password" 
            placeholder="Mínimo 4 dígitos"
            value={newPin} 
            onChange={(val) => setNewPin(val)} 
          />
          <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">Actualizar PIN</button>
        </form>
      </Modal>
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
