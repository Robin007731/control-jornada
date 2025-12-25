
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
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Persistence
  useEffect(() => {
    const savedData = localStorage.getItem('llavero_data');
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
    localStorage.setItem('llavero_data', JSON.stringify({ workDays, advances, settings }));
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
    <div className="min-h-screen pb-24 bg-gray-50 flex flex-col">
      <header className="bg-blue-600 text-white p-4 shadow-lg sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-6 h-6" />
            Registro laboral
          </h1>
          <div className="flex items-center gap-4">
            {lastAction && (
              <button 
                onClick={handleUndo}
                className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors"
                title="Deshacer última acción"
              >
                <Undo className="w-5 h-5" />
              </button>
            )}
            <span className="text-sm font-medium hidden sm:inline">{settings.workerName}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-4 space-y-6">
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

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-2 flex justify-between items-center z-50">
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
          label="Historial" 
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
    className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${active ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-blue-400'}`}
  >
    {/* Corrected: Added 'any' type to React.ReactElement to allow cloning with className */}
    {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-6 h-6' })}
    <span className="text-xs font-semibold">{label}</span>
  </button>
);

export default App;
