
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  Clock, History as HistoryIcon, Settings as SettingsIcon, FileText, Undo, 
  ShieldCheck, ArrowRight, Check, Plus, Minus, Play, Coffee, LogOut, 
  CheckCircle, AlertCircle, Download, Trash2, Edit2, Copy, Calendar, Save, 
  User, Wallet, Shield, RefreshCw, Upload, Smartphone, Share2, X, Lock,
  TrendingUp, BarChart3, ChevronRight, Info, Search, Sparkles, Loader2,
  Terminal, CalendarRange, RotateCcw
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

// --- CONSTANTES ---
const URUGUAY_HOLIDAYS = [
  { month: 0, day: 1, name: 'Año Nuevo' },
  { month: 0, day: 6, name: 'Día de Reyes' },
  { month: 3, day: 19, name: 'Desembarco de los 33' },
  { month: 4, day: 1, name: 'Día de los Trabajadores' },
  { month: 4, day: 18, name: 'Batalla de las Piedras' },
  { month: 5, day: 19, name: 'Natalicio de Artigas' },
  { month: 6, day: 18, name: 'Jura de la Constitución' },
  { month: 7, day: 25, name: 'Declaratoria de la Independencia' },
  { month: 9, day: 12, name: 'Día de la Raza' },
  { month: 10, day: 2, name: 'Día de los Difuntos' },
  { month: 11, day: 25, name: 'Día de la Familia' },
];

const DEFAULT_SALARY = 29267;
const HOURS_IN_MONTH = 160;

// --- TIPOS ---
interface WorkDay {
  id: string;
  date: string;
  entryTime?: string;
  breakStartTime?: string;
  breakEndTime?: string;
  exitTime?: string;
  isHalfDay: boolean;
  status: 'incomplete' | 'complete';
  allowance: number;
}

interface Advance {
  id: string;
  date: string;
  amount: number;
  note?: string;
}

interface UserSettings {
  workerName: string;
  monthlySalary: number;
  hourlyRate: number;
  useHourlyRate: boolean;
  passwordHash: string;
  onboardingComplete: boolean;
  simplifiedMode: boolean;
  bpsRate: number;
  extraMultiplier: number;
  specialDayMultiplier: number;
}

// --- UTILIDADES ---
const formatCurrency = (amount: number) => 
  new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(amount);

const isHoliday = (date: Date) => 
  URUGUAY_HOLIDAYS.some(h => h.month === date.getMonth() && h.day === date.getDate());

const isSunday = (date: Date) => date.getDay() === 0;

const calculateDuration = (day: WorkDay): number => {
  if (!day.entryTime || !day.exitTime) return 0;
  const start = new Date(day.entryTime).getTime();
  const end = new Date(day.exitTime).getTime();
  let durationMs = end - start;
  if (day.breakStartTime && day.breakEndTime) {
    const bStart = new Date(day.breakStartTime).getTime();
    const bEnd = new Date(day.breakEndTime).getTime();
    durationMs -= Math.max(0, (bEnd - bStart));
  }
  return Math.max(0, durationMs / (1000 * 60 * 60));
};

const getDayFinancials = (day: WorkDay, settings: UserSettings) => {
  const duration = calculateDuration(day);
  const date = new Date(day.date);
  const isSpecial = isSunday(date) || isHoliday(date);
  
  const baseRate = settings.useHourlyRate ? settings.hourlyRate : (settings.monthlySalary / HOURS_IN_MONTH);
  const multiplier = isSpecial ? settings.specialDayMultiplier : 1;
  
  const normalHours = Math.min(8, duration);
  const extraHours = Math.max(0, duration - 8);
  
  const gross = (normalHours * baseRate * multiplier) + 
                (extraHours * baseRate * settings.extraMultiplier * multiplier);
  
  return { duration, normalHours, extraHours, gross, isSpecial };
};

const getSummary = (workDays: WorkDay[], settings: UserSettings, advances: Advance[]) => {
  let totalGross = 0, totalNormal = 0, totalExtra = 0, totalAllowances = 0;
  
  workDays.forEach(day => {
    const { gross, normalHours, extraHours } = getDayFinancials(day, settings);
    totalGross += gross;
    totalNormal += normalHours;
    totalExtra += extraHours;
    totalAllowances += (day.allowance || 0);
  });

  const bpsDiscount = totalGross * (settings.bpsRate / 100);
  const totalAdvances = advances.reduce((acc, curr) => acc + curr.amount, 0);
  const netPay = (totalGross - bpsDiscount - totalAdvances) + totalAllowances;
  
  return { totalGross, totalNormal, totalExtra, bpsDiscount, totalAdvances, totalAllowances, netPay };
};

// --- COMPONENTES ---

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-slide-up border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <h3 className="font-bold text-lg text-gray-800 tracking-tight">{title}</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};

const Onboarding: React.FC<{ onComplete: (name: string) => void }> = ({ onComplete }) => {
  const [name, setName] = useState('');
  const [step, setStep] = useState(1);
  const [accepted, setAccepted] = useState(false);

  return (
    <div className="min-h-screen bg-blue-600 flex items-center justify-center p-4 text-white">
      <div className="max-w-xs w-full space-y-6 animate-fade-in">
        {step === 1 && (
          <div className="text-center space-y-8">
            <div className="bg-white/10 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-xl border border-white/20 shadow-2xl">
              <ShieldCheck className="w-10 h-10 text-white" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black italic tracking-tighter uppercase leading-none text-white">Registro laboral</h1>
              <p className="text-blue-100 font-bold text-xs tracking-widest uppercase">By Nexa Studio</p>
            </div>
            <div className="bg-white text-gray-900 p-6 rounded-3xl shadow-2xl space-y-6 text-left">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-gray-800">¡Bienvenido!</h2>
                <p className="text-gray-400 text-xs">Dinos tu nombre para comenzar.</p>
              </div>
              <input type="text" placeholder="Juan Pérez" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:border-blue-500 outline-none font-bold text-lg transition-all" value={name} onChange={(e) => setName(e.target.value)} />
              <button disabled={!name.trim()} onClick={() => setStep(2)} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
                CONTINUAR <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white text-gray-900 p-6 rounded-3xl shadow-2xl space-y-5 animate-slide-up">
            <h2 className="text-xl font-black text-gray-800 uppercase italic">Privacidad y Términos</h2>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-[10px] text-gray-600 space-y-3 h-64 overflow-y-auto leading-relaxed">
              <p className="font-black text-blue-600 uppercase border-b border-gray-200 pb-1">1. Almacenamiento Local (Local-First)</p>
              <p>Registro laboral es una aplicación privada. Toda la información ingresada reside exclusivamente en tu dispositivo. Nexa Studio no recolecta, almacena ni vende tus datos en servidores externos.</p>
              
              <p className="font-black text-blue-600 uppercase border-b border-gray-200 pb-1">2. Cálculos y Leyes</p>
              <p>Los cálculos están optimizados para Uruguay, aplicando el descuento estándar de BPS (22%) y recargos por horas extras (1.5x o 2.0x). Estos valores son referenciales.</p>
              
              <p className="font-black text-blue-600 uppercase border-b border-gray-200 pb-1">3. Responsabilidad</p>
              <p>Tú eres responsable de respaldar tus datos. Si borras el caché del navegador, los datos se perderán a menos que utilices la función de Backup en Ajustes.</p>
              
              <p className="font-black text-blue-600 uppercase border-b border-gray-200 pb-1">4. Propiedad Intelectual</p>
              <p>Esta aplicación es un producto desarrollado por Nexa Studio. Su uso es libre para el control personal de jornadas laborales.</p>
            </div>
            
            <label className="flex items-start gap-3 p-2 cursor-pointer group">
              <div className="relative mt-0.5">
                <input type="checkbox" className="peer opacity-0 absolute w-5 h-5" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
                <div className="w-5 h-5 bg-gray-100 border-2 border-gray-200 rounded-md peer-checked:bg-blue-600 peer-checked:border-blue-600 flex items-center justify-center transition-all">
                  <Check className="w-3 h-3 text-white" />
                </div>
              </div>
              <span className="text-[10px] font-bold text-gray-500 uppercase leading-tight select-none">He leído y acepto todas las políticas de privacidad y uso de Nexa Studio.</span>
            </label>

            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="flex-1 py-4 font-bold text-gray-400 text-xs uppercase">Atrás</button>
              <button disabled={!accepted} onClick={() => onComplete(name)} className="flex-[2] bg-blue-600 text-white py-4 rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-all disabled:opacity-50">CONFIRMAR Y ENTRAR</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Dashboard: React.FC<{ workDays: WorkDay[]; settings: UserSettings; advances: Advance[]; onAction: (day: WorkDay) => void }> = ({ workDays, settings, advances, onAction }) => {
  const summary = getSummary(workDays, settings, advances);
  const today = new Date();
  const todayStr = today.toDateString();
  const currentDay = workDays.find(d => new Date(d.date).toDateString() === todayStr) || { id: crypto.randomUUID(), date: today.toISOString(), isHalfDay: false, status: 'incomplete', allowance: 0 };

  const registerAction = () => {
    const now = new Date().toISOString();
    let updated: WorkDay = { ...currentDay };
    if (!updated.entryTime) updated.entryTime = now;
    else if (!settings.simplifiedMode && !updated.breakStartTime) updated.breakStartTime = now;
    else if (!settings.simplifiedMode && !updated.breakEndTime) updated.breakEndTime = now;
    else if (!updated.exitTime) { updated.exitTime = now; updated.status = 'complete'; }
    onAction(updated);
  };

  const getNextAction = () => {
    if (!currentDay.entryTime) return { label: 'ENTRADA', icon: <Play className="w-5 h-5 fill-current" />, color: 'bg-blue-600' };
    if (!settings.simplifiedMode) {
      if (!currentDay.breakStartTime) return { label: 'DESCANSO', icon: <Coffee className="w-5 h-5" />, color: 'bg-amber-500' };
      if (!currentDay.breakEndTime) return { label: 'FIN DESCANSO', icon: <Play className="w-5 h-5" />, color: 'bg-green-600' };
    }
    if (!currentDay.exitTime) return { label: 'SALIDA', icon: <LogOut className="w-5 h-5" />, color: 'bg-red-600' };
    return { label: 'COMPLETADO', icon: <CheckCircle className="w-5 h-5" />, color: 'bg-gray-800' };
  };

  const action = getNextAction();
  const progress = (summary.totalNormal / HOURS_IN_MONTH) * 100;
  const isDone = currentDay.status === 'complete';

  return (
    <div className="space-y-4 animate-fade-in max-w-xl mx-auto">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center">
        <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-1">Cobro Estimado</p>
        <h2 className="text-3xl font-black text-gray-900 mb-4">{formatCurrency(summary.netPay)}</h2>
        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden mb-2">
          <div className="bg-blue-600 h-full transition-all duration-1000" style={{ width: `${Math.min(100, progress)}%` }}></div>
        </div>
        <p className="text-[10px] font-bold text-blue-600">{summary.totalNormal.toFixed(1)}h de {HOURS_IN_MONTH}h</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
          <TrendingUp className="text-blue-600 w-5 h-5 mb-1" />
          <p className="text-[9px] font-bold text-blue-400 uppercase">H. Extras</p>
          <p className="text-xl font-black text-blue-700">{summary.totalExtra.toFixed(1)}h</p>
        </div>
        <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
          <Wallet className="text-green-600 w-5 h-5 mb-1" />
          <p className="text-[9px] font-bold text-green-400 uppercase">Viáticos</p>
          <p className="text-xl font-black text-green-700">{formatCurrency(summary.totalAllowances)}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-gray-800 tracking-tight">Registro Diario</h3>
            <p className="text-gray-400 font-bold text-[10px] uppercase">{today.toLocaleDateString('es-UY', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>
          {(isSunday(today) || isHoliday(today)) && <span className="bg-amber-100 text-amber-700 text-[9px] px-2 py-0.5 rounded-full font-black italic">2X</span>}
        </div>

        <button 
          disabled={isDone} 
          onClick={registerAction} 
          className={`w-full ${action.color} text-white py-6 rounded-2xl font-bold text-lg shadow-md active:scale-95 transition-all flex flex-col items-center gap-2 disabled:opacity-50 disabled:scale-100`}
        >
          {action.icon}
          {action.label}
        </button>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <TimeBadge label="E" time={currentDay.entryTime} />
          {!settings.simplifiedMode && <>
            <TimeBadge label="D+" time={currentDay.breakStartTime} />
            <TimeBadge label="D-" time={currentDay.breakEndTime} />
          </>}
          <TimeBadge label="S" time={currentDay.exitTime} />
        </div>
      </div>
    </div>
  );
};

const TimeBadge = ({ label, time }: { label: string, time?: string }) => (
  <div className="bg-gray-50 p-2.5 rounded-xl text-center border border-gray-100">
    <span className="block text-[8px] font-black text-gray-400 uppercase mb-0.5">{label}</span>
    <span className="text-xs font-bold text-gray-700">{time ? new Date(time).toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
  </div>
);

// --- ASISTENTE IA MEJORADO ---
const AIAssistant: React.FC<{ onApply: (toAdd: WorkDay[], toDelete: string[]) => void }> = ({ onApply }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<{ toAdd: WorkDay[], toDeleteDates: string[] } | null>(null);

  const handleMagicAction = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setPreview(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const today = new Date();
      const todayISO = today.toISOString().split('T')[0];
      const todayFull = today.toLocaleDateString('es-UY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

      const systemInstruction = `
        Eres Nexa AI, el cerebro de gestión horaria de la aplicación 'Registro laboral'.
        CONTEXTO ACTUAL: Hoy es ${todayFull}.
        
        MISION: Traducir órdenes de lenguaje natural a un esquema JSON de jornadas laborales.
        
        REGLAS DE ORO PARA EL TIEMPO (CRITICO):
        1. NO CONVIERTAS HORAS A UTC. Usa las horas literales que pida el usuario.
        2. Si el usuario pide "14:00", el string ISO resultante debe terminar en "T14:00:00" para esa fecha local.
        3. Si detectas un desfase de 3 horas (ej: pones 11:00 cuando piden 14:00), ESTAS COMETIENDO UN ERROR. Mantén la hora exacta.

        REGLAS DE LOGICA:
        1. RANGOS: Genera una entrada para CADA DÍA entre la fecha inicial y la final (inclusive).
        2. EXCEPCIONES: Si pide "librando lunes", omite los lunes. Si pide "martes medio dia", marca esos martes como isHalfDay: true y usa el horario específico.
        3. ELIMINACION: Si pide "borrar" o "quitar", pon las fechas YYYY-MM-DD en el array 'toDeleteDates'.
        4. SOBRESCRITURA: Genera los 'toAdd' con la fecha correcta; la app reemplazará los existentes.

        ESTRUCTURA DE SALIDA (JSON ESTRICTO):
        {
          "toAdd": [
            {
              "id": "uuid-v4",
              "date": "YYYY-MM-DD",
              "entryTime": "YYYY-MM-DDTHH:mm:00",
              "exitTime": "YYYY-MM-DDTHH:mm:00",
              "isHalfDay": boolean,
              "status": "complete",
              "allowance": 0
            }
          ],
          "toDeleteDates": ["YYYY-MM-DD"]
        }
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              toAdd: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    date: { type: Type.STRING },
                    entryTime: { type: Type.STRING },
                    exitTime: { type: Type.STRING },
                    isHalfDay: { type: Type.BOOLEAN },
                    status: { type: Type.STRING },
                    allowance: { type: Type.NUMBER }
                  },
                  required: ['id', 'date', 'entryTime', 'exitTime', 'isHalfDay', 'status', 'allowance']
                }
              },
              toDeleteDates: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ['toAdd', 'toDeleteDates']
          }
        }
      });

      const data = JSON.parse(response.text || '{"toAdd": [], "toDeleteDates": []}');
      setPreview(data);
    } catch (error) {
      console.error(error);
      alert('Error en Nexa AI: No pude procesar tu solicitud. Prueba siendo más específico con las horas.');
    } finally {
      setLoading(false);
    }
  };

  const confirmAction = () => {
    if (preview) {
      onApply(preview.toAdd, preview.toDeleteDates);
      setPreview(null);
      setPrompt('');
      setIsOpen(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-600/5 to-purple-600/5 hover:from-blue-600/10 hover:to-purple-600/10 transition-all"
      >
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-1.5 rounded-lg text-white shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-black text-xs text-gray-800 italic uppercase tracking-tighter">Asistente Nexa AI</span>
        </div>
        <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
      </button>

      {isOpen && (
        <div className="p-4 space-y-4 animate-fade-in">
          <div className="flex items-start gap-2 bg-blue-50/50 p-3 rounded-xl border border-blue-100/50">
             <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
             <p className="text-[10px] text-blue-700 leading-tight font-bold">
               Ej: "Agregame del 1/12 de 14 a 22 hasta hoy, sin los lunes y martes medio turno de 14 a 18"
             </p>
          </div>
          <textarea 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Dime qué jornadas quieres gestionar..."
            className="w-full h-24 p-3 bg-gray-50 rounded-xl text-xs font-bold border-none focus:ring-2 focus:ring-blue-600 outline-none resize-none transition-all placeholder:text-gray-300"
          />
          
          <button 
            disabled={loading || !prompt.trim()}
            onClick={handleMagicAction}
            className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 shadow-md"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Terminal className="w-4 h-4" />}
            {loading ? 'ANALIZANDO HORARIOS...' : 'EJECUTAR CON IA'}
          </button>

          {preview && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 animate-slide-up">
              <div className="flex items-center gap-2 mb-3">
                 <CalendarRange className="w-4 h-4 text-gray-600" />
                 <h4 className="text-[10px] font-black text-gray-800 uppercase">Resumen de Cambios:</h4>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-white p-2 rounded-lg border border-gray-100">
                  <p className="text-[8px] font-black text-gray-400 uppercase">A crear/editar</p>
                  <p className="text-sm font-black text-blue-600">{preview.toAdd.length} <span className="text-[10px] text-gray-400">Días</span></p>
                </div>
                <div className="bg-white p-2 rounded-lg border border-gray-100">
                  <p className="text-[8px] font-black text-gray-400 uppercase">A eliminar</p>
                  <p className="text-sm font-black text-red-600">{preview.toDeleteDates.length} <span className="text-[10px] text-gray-400">Fechas</span></p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setPreview(null)} className="flex-1 bg-white border border-gray-200 text-gray-400 py-2 rounded-lg font-bold text-[9px] uppercase">Atrás</button>
                <button onClick={confirmAction} className="flex-[2] bg-blue-600 text-white py-2 rounded-lg font-bold text-[9px] uppercase shadow-sm active:scale-95">Aplicar al Historial</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const History: React.FC<{ workDays: WorkDay[]; setWorkDays: React.Dispatch<React.SetStateAction<WorkDay[]>>; settings: UserSettings }> = ({ workDays, setWorkDays, settings }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDay, setEditingDay] = useState<Partial<WorkDay> | null>(null);
  const [filter, setFilter] = useState('');

  const sortedDays = useMemo(() => {
    return [...workDays]
      .filter(d => d.date.includes(filter))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [workDays, filter]);

  const getTimeValue = (iso?: string) => {
    if (!iso) return '';
    const date = new Date(iso);
    return date.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const handleTimeChange = (field: keyof WorkDay, time: string) => {
    if (!editingDay || !editingDay.date) return;
    const datePart = editingDay.date.split('T')[0];
    const newDateTime = `${datePart}T${time}:00`;
    setEditingDay(prev => ({ ...prev, [field]: newDateTime }));
  };

  const applyAIChanges = (toAdd: WorkDay[], toDeleteDates: string[]) => {
    setWorkDays(prev => {
      let filtered = prev.filter(d => !toDeleteDates.includes(d.date.split('T')[0]));
      const addDates = toAdd.map(a => a.date.split('T')[0]);
      filtered = filtered.filter(f => !addDates.includes(f.date.split('T')[0]));
      return [...toAdd, ...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });
  };

  return (
    <div className="space-y-4 animate-fade-in max-w-xl mx-auto">
      <AIAssistant onApply={applyAIChanges} />

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-black text-gray-800 italic uppercase">Historial</h2>
        <div className="relative flex-1 max-w-[140px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input 
            type="month" 
            className="w-full pl-9 pr-2 py-2 bg-white rounded-xl border border-gray-100 text-xs font-bold"
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <button onClick={() => { setEditingDay({ id: crypto.randomUUID(), date: new Date().toISOString().split('T')[0], status: 'complete', isHalfDay: false, allowance: 0 }); setIsModalOpen(true); }} className="p-2 bg-blue-600 text-white rounded-xl shadow-md">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-2">
        {sortedDays.map(day => {
          const fin = getDayFinancials(day, settings);
          return (
            <div key={day.id} className={`bg-white rounded-xl p-4 shadow-sm border-l-4 flex justify-between items-center transition-all ${fin.isSpecial ? 'border-amber-400' : 'border-blue-600'}`}>
              <div className="flex gap-3 items-center">
                <div className="bg-gray-50 rounded-lg p-2 text-center min-w-[45px]">
                  <span className="block text-[8px] font-black text-gray-400 uppercase">{new Date(day.date).toLocaleDateString('es-UY', { weekday: 'short' })}</span>
                  <span className="block text-base font-black text-gray-800">{new Date(day.date).getDate()}</span>
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-sm uppercase tracking-tight">{new Date(day.date).toLocaleDateString('es-UY', { month: 'short' })}</p>
                  <p className="text-[10px] font-bold text-gray-400">{getTimeValue(day.entryTime)} — {getTimeValue(day.exitTime)}</p>
                </div>
              </div>
              <div className="text-right flex items-center gap-4">
                <div>
                  <p className="text-lg font-black text-blue-600 tracking-tighter">{fin.duration.toFixed(1)}h</p>
                  {day.isHalfDay && <span className="text-[7px] font-black text-green-600 uppercase">1/2 Turno</span>}
                </div>
                <div className="flex flex-col gap-1">
                  <button onClick={() => { setEditingDay(day); setIsModalOpen(true); }} className="text-gray-300 hover:text-blue-600"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => { if(confirm('¿Eliminar?')) setWorkDays(p => p.filter(d => d.id !== day.id)); }} className="text-gray-300 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          );
        })}
        {sortedDays.length === 0 && (
          <div className="py-20 text-center opacity-20">
             <Calendar className="w-16 h-16 mx-auto mb-2" />
             <p className="font-black text-xs uppercase tracking-widest italic">Sin registros</p>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Editar Jornada">
        <form onSubmit={(e) => { e.preventDefault(); setWorkDays(p => p.some(d => d.id === editingDay!.id) ? p.map(d => d.id === editingDay!.id ? editingDay as WorkDay : d) : [editingDay as WorkDay, ...p]); setIsModalOpen(false); }} className="space-y-4">
          <div><label className="text-[9px] font-black text-gray-400 uppercase mb-1 block">Fecha</label><input type="date" required className="w-full px-4 py-3 bg-gray-50 rounded-xl font-bold text-sm" value={editingDay?.date?.split('T')[0] || ''} onChange={(e) => setEditingDay({ ...editingDay, date: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[9px] font-black text-gray-400 uppercase mb-1 block">Entrada</label><input type="time" required className="w-full px-4 py-3 bg-gray-50 rounded-xl font-bold text-sm" value={getTimeValue(editingDay?.entryTime)} onChange={(e) => handleTimeChange('entryTime', e.target.value)} /></div>
            <div><label className="text-[9px] font-black text-gray-400 uppercase mb-1 block">Salida</label><input type="time" required className="w-full px-4 py-3 bg-gray-50 rounded-xl font-bold text-sm" value={getTimeValue(editingDay?.exitTime)} onChange={(e) => handleTimeChange('exitTime', e.target.value)} /></div>
          </div>
          <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl">
             <input type="checkbox" id="editHalf" checked={editingDay?.isHalfDay || false} onChange={(e) => setEditingDay({...editingDay, isHalfDay: e.target.checked})} className="w-4 h-4 rounded text-blue-600" />
             <label htmlFor="editHalf" className="text-[10px] font-bold text-gray-700 uppercase">Medio Turno (Sin descanso)</label>
          </div>
          <div><label className="text-[9px] font-black text-gray-400 uppercase mb-1 block">Viáticos ($)</label><input type="number" className="w-full px-4 py-3 bg-gray-50 rounded-xl font-bold text-sm" value={editingDay?.allowance || ''} onChange={(e) => setEditingDay({ ...editingDay, allowance: Number(e.target.value) })} /></div>
          <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-base shadow-lg">GUARDAR</button>
        </form>
      </Modal>
    </div>
  );
};

const SettingsComp: React.FC<{ settings: UserSettings; setSettings: React.Dispatch<React.SetStateAction<UserSettings>>; advances: Advance[]; onAddAdvance: (adv: Advance) => void; onDeleteAdvance: (id: string) => void; workDays: WorkDay[]; setWorkDays: React.Dispatch<React.SetStateAction<WorkDay[]>> }> = ({ settings, setSettings, advances, onAddAdvance, onDeleteAdvance, workDays, setWorkDays }) => {
  const [isAuth, setIsAuth] = useState(false);
  const [pass, setPass] = useState('');
  const [newAdv, setNewAdv] = useState({ amt: '', note: '' });
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const installApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setDeferredPrompt(null);
    } else {
      alert('Para descargar: Toca el icono de compartir y selecciona "Añadir a pantalla de inicio".');
    }
  };

  if (!isAuth) return (
    <div className="py-12 px-4 flex flex-col items-center justify-center animate-fade-in">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-xs text-center space-y-6 text-gray-800">
        <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"><Lock className="w-8 h-8 text-blue-600" /></div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold">ÁREA PRIVADA</h2>
          <p className="text-gray-400 text-xs uppercase font-bold tracking-widest">Nexa Studio Secure</p>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); if (pass === settings.passwordHash) setIsAuth(true); else alert('Contraseña incorrecta'); }} className="space-y-4">
          <input type="password" placeholder="Pin" className="w-full px-4 py-4 rounded-2xl border border-gray-100 text-center text-xl font-black tracking-widest outline-none transition-all" value={pass} onChange={(e) => setPass(e.target.value)} autoFocus />
          <button className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-md">ENTRAR</button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-20 max-w-xl mx-auto relative">
      <section className="space-y-3">
        <h3 className="text-sm font-black text-gray-800 italic flex items-center gap-2 px-1 uppercase tracking-wider"><User className="text-blue-600 w-4 h-4" /> Perfil y Salario</h3>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-50 space-y-4 text-gray-800">
          <div><label className="text-[9px] font-black text-gray-400 uppercase mb-1 block ml-1">Nombre</label><input type="text" value={settings.workerName} onChange={(e) => setSettings(p => ({ ...p, workerName: e.target.value }))} className="w-full px-4 py-2.5 bg-gray-50 rounded-xl font-bold text-sm outline-none" /></div>
          <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl">
            <div className="flex-1">
              <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Cálculo</p>
              <div className="flex gap-1.5">
                <button onClick={() => setSettings(p => ({ ...p, useHourlyRate: false }))} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold ${!settings.useHourlyRate ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-gray-400'}`}>MENSUAL</button>
                <button onClick={() => setSettings(p => ({ ...p, useHourlyRate: true }))} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold ${settings.useHourlyRate ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-gray-400'}`}>HORA</button>
              </div>
            </div>
            <div className="flex-1">
              <label className="text-[8px] font-black text-gray-400 uppercase mb-1 block">Monto ($)</label>
              <input type="number" value={settings.useHourlyRate ? settings.hourlyRate : settings.monthlySalary} onChange={(e) => setSettings(p => ({ ...p, [settings.useHourlyRate ? 'hourlyRate' : 'monthlySalary']: Number(e.target.value) }))} className="w-full px-3 py-1.5 bg-white rounded-lg font-bold text-sm" />
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-black text-gray-800 italic flex items-center gap-2 px-1 uppercase tracking-wider"><Wallet className="text-green-600 w-4 h-4" /> Adelantos</h3>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-50 space-y-4 text-gray-800">
          <div className="flex gap-2">
            <input type="number" placeholder="$" className="w-20 px-3 py-2.5 bg-gray-50 rounded-xl font-bold text-sm" value={newAdv.amt} onChange={(e) => setNewAdv({...newAdv, amt: e.target.value})} />
            <input type="text" placeholder="Nota" className="flex-1 px-4 py-2.5 bg-gray-50 rounded-xl font-bold text-sm" value={newAdv.note} onChange={(e) => setNewAdv({...newAdv, note: e.target.value})} />
            <button onClick={() => { if(newAdv.amt) onAddAdvance({ id: crypto.randomUUID(), date: new Date().toISOString(), amount: Number(newAdv.amt), note: newAdv.note }); setNewAdv({amt:'', note:''})}} className="bg-green-600 text-white px-4 rounded-xl font-bold text-xs">OK</button>
          </div>
          <div className="space-y-1.5">{advances.map(a => <div key={a.id} className="flex justify-between items-center px-4 py-2.5 bg-gray-50 rounded-xl text-xs"><span className="font-bold text-gray-700">{formatCurrency(a.amount)} ({a.note || 'S/N'})</span><button onClick={() => onDeleteAdvance(a.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></button></div>)}</div>
        </div>
      </section>

      <section className="p-4 flex flex-col gap-3">
        <div className="flex gap-2">
           <button onClick={() => { if(confirm('¿Borrar todo?')) { localStorage.clear(); window.location.reload(); } }} className="flex-1 bg-red-50 text-red-600 py-4 rounded-xl font-bold text-[10px] flex items-center justify-center gap-2 active:scale-95 transition-all">
             <AlertCircle className="w-3 h-3" /> REINICIAR APP
           </button>
           <button onClick={() => { const data = localStorage.getItem('llavero_data'); if(data) { const blob = new Blob([data], {type: 'application/json'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'backup_registro_laboral.json'; a.click(); } }} className="flex-1 bg-blue-50 text-blue-600 py-4 rounded-xl font-bold text-[10px] flex items-center justify-center gap-2 active:scale-95 transition-all">
             <Download className="w-3 h-3" /> BACKUP
           </button>
        </div>
        <div className="text-center space-y-1 opacity-40 py-4">
           <p className="text-[8px] text-gray-600 font-black tracking-widest uppercase italic">Registro laboral v1.7 • Uruguay Edition</p>
           <p className="text-[7px] text-blue-600 font-black tracking-widest uppercase italic">Developed by Nexa Studio</p>
        </div>
      </section>

      <button 
        onClick={installApp}
        className="fixed bottom-24 right-4 bg-gray-900 text-white p-3 rounded-2xl shadow-2xl flex items-center gap-2 active:scale-95 transition-all border border-white/10 z-[60]"
      >
        <Smartphone className="w-4 h-4 text-blue-400" />
        <span className="text-[10px] font-black uppercase tracking-tighter">Descargar App</span>
      </button>
    </div>
  );
};

const App: React.FC = () => {
  const [tab, setTab] = useState<'dash' | 'hist' | 'sett'>('dash');
  const [days, setDays] = useState<WorkDay[]>([]);
  const [advs, setAdvs] = useState<Advance[]>([]);
  const [settings, setSettings] = useState<UserSettings>({ 
    workerName: '', monthlySalary: DEFAULT_SALARY, hourlyRate: 150, useHourlyRate: false, 
    passwordHash: '1234', onboardingComplete: false, simplifiedMode: false,
    bpsRate: 22, extraMultiplier: 1.5, specialDayMultiplier: 2.0
  });

  useEffect(() => {
    const saved = localStorage.getItem('llavero_data');
    if (saved) { 
      try { 
        const p = JSON.parse(saved); 
        setDays(p.days || []); setAdvs(p.advs || []); setSettings(s => ({ ...s, ...p.settings })); 
      } catch (e) { console.error(e); } 
    }
  }, []);

  useEffect(() => { 
    localStorage.setItem('llavero_data', JSON.stringify({ days, advs, settings })); 
  }, [days, advs, settings]);

  if (!settings.onboardingComplete) return <Onboarding onComplete={(n) => setSettings(s => ({ ...s, workerName: n, onboardingComplete: true }))} />;

  return (
    <div className="min-h-screen pb-24 bg-gray-50 flex flex-col selection:bg-blue-100 selection:text-blue-900">
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 px-4 py-3">
        <div className="max-w-xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg text-white shadow-sm"><ShieldCheck className="w-4 h-4" /></div>
            <h1 className="text-lg font-black italic tracking-tighter text-gray-800 uppercase">Registro laboral</h1>
          </div>
          <div className="text-right">
            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tight leading-none mb-0.5">Trabajador/a</p>
            <p className="text-sm font-black text-blue-600 max-w-[120px] truncate leading-none">{settings.workerName}</p>
          </div>
        </div>
      </header>
      
      <main className="flex-1 max-w-xl mx-auto w-full px-4 py-5">
        {tab === 'dash' && <Dashboard workDays={days} settings={settings} advances={advs} onAction={(d) => setDays(p => { const ex = p.find(old => new Date(old.date).toDateString() === new Date(d.date).toDateString()); return ex ? p.map(o => o.id === ex.id ? d : o) : [d, ...p]; })} />}
        {tab === 'hist' && <History workDays={days} setWorkDays={setDays} settings={settings} />}
        {tab === 'sett' && <SettingsComp settings={settings} setSettings={setSettings} advances={advs} onAddAdvance={(a) => setAdvs(p => [...p, a])} onDeleteAdvance={(id) => setAdvs(p => p.filter(a => a.id !== id))} workDays={days} setWorkDays={setDays} />}
      </main>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900/95 backdrop-blur-lg px-8 py-3.5 rounded-full flex gap-10 items-center z-50 shadow-xl border border-white/5">
        <NavBtn act={tab === 'dash'} onClick={() => setTab('dash')} icon={<Clock />} lbl="Registro" />
        <NavBtn act={tab === 'hist'} onClick={() => setTab('hist')} icon={<HistoryIcon />} lbl="Historial" />
        <NavBtn act={tab === 'sett'} onClick={() => setTab('sett')} icon={<SettingsIcon />} lbl="Ajustes" />
      </nav>
    </div>
  );
};

const NavBtn = ({ act, onClick, icon, lbl }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-0.5 transition-all ${act ? 'text-blue-400 scale-105' : 'text-gray-400 hover:text-white'}`}>
    {React.cloneElement(icon, { className: 'w-5 h-5' })}
    <span className="text-[8px] font-black uppercase tracking-widest">{lbl}</span>
  </button>
);

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<React.StrictMode><App /></React.StrictMode>);
