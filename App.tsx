
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Clock, 
  History as HistoryIcon, 
  Settings as SettingsIcon, 
  FileText, 
  Undo,
  ShieldCheck,
  TrendingUp,
  Bell
} from 'lucide-react';
import { WorkDay, UserSettings, Advance } from './types';
import { DEFAULT_SALARY } from './constants';
import { generateCSV, getLocalDateString } from './utils';

// Components
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import History from './components/History';
import Settings from './components/Settings';
import Receipt from './components/Receipt';
import AIAssistant from './components/AIAssistant';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'settings' | 'receipt'>('dashboard');
  const [workDays, setWorkDays] = useState<WorkDay[]>([]);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
    workerName: '',
    workplaceName: '',
    monthlySalary: 0,
    passwordHash: '1234',
    onboardingComplete: false,
    simplifiedMode: false,
    notificationsEnabled: false,
  });
  const [lastAction, setLastAction] = useState<WorkDay[] | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Motor de sonido sintético suave (Chime Aura)
  const playSoftChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(528, audioCtx.currentTime); // Frecuencia de calma
      
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.1); // Ataque suave
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.5); // Desvanecimiento largo

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 1.5);
    } catch (e) {
      console.error("Audio no soportado", e);
    }
  };

  useEffect(() => {
    const savedData = localStorage.getItem('llavpodes_data_pro');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setWorkDays(parsed.workDays || []);
        setAdvances(parsed.advances || []);
        setSettings(prev => ({ ...prev, ...parsed.settings }));
      } catch (e) {
        console.error("Error loading data", e);
      }
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  // Lógica de recordatorio de salida (8 horas)
  useEffect(() => {
    if (!settings.notificationsEnabled) return;

    const checkJornada = () => {
      const todayStr = getLocalDateString();
      const today = workDays.find(d => d.date === todayStr);
      
      if (today && today.entryTime && !today.exitTime) {
        const entryDate = new Date(today.entryTime);
        const now = new Date();
        const diffHours = (now.getTime() - entryDate.getTime()) / (1000 * 60 * 60);

        // Si pasaron 8 horas y la app está activa, avisar con el sonido
        if (diffHours >= 8) {
          if (Notification.permission === 'granted') {
            new Notification("Llavpodes: Fin de Jornada", {
              body: `${settings.workerName}, ya pasaron 8 horas. ¿Marcamos la salida?`,
              icon: '/icon.png',
              silent: true // Usamos nuestro sonido manual
            });
            playSoftChime();
            if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
          }
        }
      }
    };

    const interval = setInterval(checkJornada, 1000 * 60 * 15); // Chequear cada 15 min
    return () => clearInterval(interval);
  }, [workDays, settings]);

  useEffect(() => {
    localStorage.setItem('llavpodes_data_pro', JSON.stringify({ workDays, advances, settings }));
  }, [workDays, advances, settings]);

  const handleAction = useCallback((day: WorkDay) => {
    setLastAction([...workDays]);
    setWorkDays(prev => {
      const existingIdx = prev.findIndex(d => d.date === day.date);
      if (existingIdx > -1) {
        const newArr = [...prev];
        newArr[existingIdx] = day;
        return newArr;
      }
      return [day, ...prev];
    });
  }, [workDays]);

  const handleUndo = () => {
    if (lastAction) {
      setWorkDays(lastAction);
      setLastAction(null);
    }
  };

  const installApp = async () => {
    if (!deferredPrompt) {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      if (isIOS) {
        alert("En iPhone: Toca 'Compartir' y luego 'Añadir a pantalla de inicio'.");
      } else {
        alert("La aplicación ya está instalada o tu navegador no soporta instalación directa.");
      }
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  if (!settings.onboardingComplete) {
    return (
      <Onboarding 
        onComplete={(name, salary) => setSettings(s => ({ 
          ...s, 
          workerName: name, 
          monthlySalary: salary, 
          onboardingComplete: true,
          notificationsEnabled: false
        }))} 
      />
    );
  }

  return (
    <div className="min-h-screen pb-28 bg-slate-50 flex flex-col font-sans selection:bg-blue-100 antialiased">
      <header className="bg-slate-900 text-white p-5 shadow-2xl sticky top-0 z-50 rounded-b-[2rem]">
        <div className="max-w-xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg rotate-3">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tighter uppercase leading-none italic">Llavpodes</h1>
              <p className="text-[8px] font-bold text-blue-400 uppercase tracking-[0.2em] mt-1">Soberanía Laboral</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {lastAction && (
              <button 
                onClick={handleUndo}
                className="bg-white/10 p-2.5 rounded-2xl hover:bg-white/20 transition-all active:scale-90 border border-white/5"
              >
                <Undo className="w-5 h-5 text-blue-300" />
              </button>
            )}
            <div className="text-right">
              <p className="text-[7px] text-slate-500 font-black uppercase leading-none mb-1">User</p>
              <p className="text-[11px] font-black uppercase tracking-tighter truncate max-w-[100px]">{settings.workerName}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-xl mx-auto w-full p-4 space-y-6 pt-6">
        {activeTab === 'dashboard' && (
          <Dashboard 
            workDays={workDays} 
            settings={settings} 
            advances={advances}
            onAction={handleAction} 
          />
        )}
        {activeTab === 'history' && (
          <History 
            workDays={workDays} 
            setWorkDays={setWorkDays}
          />
        )}
        {activeTab === 'receipt' && (
          <Receipt 
            workDays={workDays} 
            settings={settings} 
            advances={advances} 
          />
        )}
        {activeTab === 'settings' && (
          <Settings 
            settings={settings} 
            setSettings={setSettings} 
            advances={advances}
            onAddAdvance={(adv) => setAdvances(prev => [...prev, adv])}
            onDeleteAdvance={(id) => setAdvances(prev => prev.filter(a => a.id !== id))}
            workDays={workDays}
            setWorkDays={setWorkDays}
            onInstall={installApp}
            onTestSound={playSoftChime}
          />
        )}
      </main>

      <AIAssistant 
        workDays={workDays}
        setWorkDays={setWorkDays}
        settings={settings}
        setSettings={setSettings}
        advances={advances}
        onAddAdvance={(adv) => setAdvances(prev => [...prev, adv])}
        onDeleteAdvance={(id) => setAdvances(prev => prev.filter(a => a.id !== id))}
      />

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-2xl px-10 py-4 rounded-[2.5rem] flex gap-12 items-center z-50 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10">
        <NavButton 
          active={activeTab === 'dashboard'} 
          onClick={() => setActiveTab('dashboard')} 
          icon={<TrendingUp />} 
          label="Status" 
        />
        <NavButton 
          active={activeTab === 'history'} 
          onClick={() => setActiveTab('history')} 
          icon={<HistoryIcon />} 
          label="Logs" 
        />
        <NavButton 
          active={activeTab === 'receipt'} 
          onClick={() => setActiveTab('receipt')} 
          icon={<FileText />} 
          label="Report" 
        />
        <NavButton 
          active={activeTab === 'settings'} 
          onClick={() => setActiveTab('settings')} 
          icon={<SettingsIcon />} 
          label="Panel" 
        />
      </nav>
    </div>
  );
};

const NavButton: React.FC<{active: boolean, onClick: () => void, icon: React.ReactNode, label: string}> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1.5 transition-all ${active ? 'text-blue-400 scale-110' : 'text-slate-500 hover:text-slate-300'}`}
  >
    {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-6 h-6' })}
    <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

export default App;
