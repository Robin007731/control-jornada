
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Clock, 
  History as HistoryIcon, 
  Settings as SettingsIcon, 
  FileText, 
  Undo,
  ShieldCheck
} from 'lucide-react';
import { WorkDay, UserSettings, Advance } from './types';
import { DEFAULT_SALARY } from './constants';
import { generateCSV } from './utils';

// Components
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import History from './components/History';
import Settings from './components/Settings';
import Receipt from './components/Receipt';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'settings' | 'receipt'>('dashboard');
  const [workDays, setWorkDays] = useState<WorkDay[]>([]);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
    workerName: '',
    monthlySalary: DEFAULT_SALARY,
    passwordHash: '1234',
    onboardingComplete: false,
    simplifiedMode: false,
  });
  const [lastAction, setLastAction] = useState<WorkDay[] | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // PWA Install Prompt Logic
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt' as any, handler);
    return () => window.removeEventListener('beforeinstallprompt' as any, handler);
  }, []);

  // Persistence
  useEffect(() => {
    const savedData = localStorage.getItem('llavpodes_data');
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
  }, []);

  useEffect(() => {
    localStorage.setItem('llavpodes_data', JSON.stringify({ workDays, advances, settings }));
  }, [workDays, advances, settings]);

  const handleAction = useCallback((day: WorkDay) => {
    setLastAction([...workDays]);
    setWorkDays(prev => {
      const existing = prev.find(d => new Date(d.date).toDateString() === new Date(day.date).toDateString());
      if (existing) {
        return prev.map(d => d.id === existing.id ? { ...day } : d);
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

  const handleAddAdvance = (adv: Advance) => {
    setAdvances(prev => [...prev, adv]);
  };

  const handleDeleteAdvance = (id: string) => {
    setAdvances(prev => prev.filter(a => a.id !== id));
  };

  if (!settings.onboardingComplete) {
    return <Onboarding onComplete={(name) => setSettings(s => ({ ...s, workerName: name, onboardingComplete: true }))} />;
  }

  return (
    <div className="min-h-screen pb-24 bg-slate-50 flex flex-col font-sans selection:bg-blue-100">
      <header className="bg-slate-900 text-white p-4 shadow-xl sticky top-0 z-50">
        <div className="max-w-xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight uppercase leading-none">Registro Laboral</h1>
              <p className="text-[7px] font-bold text-blue-400 uppercase tracking-widest mt-1">Tu tiempo y tus ganancias, bajo tu control.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {lastAction && (
              <button 
                onClick={handleUndo}
                className="bg-white/10 p-2 rounded-xl hover:bg-white/20 transition-all active:scale-90"
                title="Deshacer"
              >
                <Undo className="w-5 h-5" />
              </button>
            )}
            <div className="text-right hidden sm:block">
              <p className="text-[7px] text-slate-400 font-black uppercase leading-none mb-1">Usuario</p>
              <p className="text-[10px] font-black uppercase tracking-tighter truncate max-w-[80px]">{settings.workerName}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-xl mx-auto w-full p-4 space-y-6">
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
            onExport={() => generateCSV(workDays)}
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
            onAddAdvance={handleAddAdvance}
            onDeleteAdvance={handleDeleteAdvance}
            workDays={workDays}
            setWorkDays={setWorkDays}
            installPrompt={deferredPrompt}
          />
        )}
      </main>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-xl px-8 py-3 rounded-full flex gap-10 items-center z-50 shadow-2xl border border-white/10">
        <NavButton 
          active={activeTab === 'dashboard'} 
          onClick={() => setActiveTab('dashboard')} 
          icon={<Clock />} 
          label="Registro" 
        />
        <NavButton 
          active={activeTab === 'history'} 
          onClick={() => setActiveTab('history')} 
          icon={<HistoryIcon />} 
          label="Libreta" 
        />
        <NavButton 
          active={activeTab === 'receipt'} 
          onClick={() => setActiveTab('receipt')} 
          icon={<FileText />} 
          label="Recibo" 
        />
        <NavButton 
          active={activeTab === 'settings'} 
          onClick={() => setActiveTab('settings')} 
          icon={<SettingsIcon />} 
          label="Ajustes" 
        />
      </nav>
    </div>
  );
};

const NavButton: React.FC<{active: boolean, onClick: () => void, icon: React.ReactNode, label: string}> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-blue-400 scale-110' : 'text-slate-500 hover:text-slate-300'}`}
  >
    {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-5 h-5' })}
    <span className="text-[7px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

export default App;
