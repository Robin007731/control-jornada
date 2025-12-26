
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import { Sparkles, Send, X, Loader2, Bot, MessageSquare, Trash2, ShieldAlert, CheckCircle2, Key, AlertCircle, ExternalLink } from 'lucide-react';
import { WorkDay, UserSettings, Advance } from '../types';
import { getSummary, formatCurrency } from '../utils';

interface AIAssistantProps {
  workDays: WorkDay[];
  setWorkDays: React.Dispatch<React.SetStateAction<WorkDay[]>>;
  settings: UserSettings;
  setSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
  advances: Advance[];
  onAddAdvance: (adv: Advance) => void;
  onDeleteAdvance: (id: string) => void;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ 
  workDays, setWorkDays, settings, setSettings, advances, onAddAdvance, onDeleteAdvance 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai' | 'error'; text: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedChat = localStorage.getItem('llavpodes_chat_v4');
    if (savedChat) {
      try { setMessages(JSON.parse(savedChat)); } catch (e) { console.error(e); }
    }
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    if (window.aistudio && window.aistudio.hasSelectedApiKey) {
      const selected = await window.aistudio.hasSelectedApiKey();
      setHasKey(selected);
    } else {
      setHasKey(true); 
    }
  };

  useEffect(() => {
    localStorage.setItem('llavpodes_chat_v4', JSON.stringify(messages));
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem('llavpodes_chat_v4');
  };

  const handleOpenKeySelector = async () => {
    if (window.aistudio && window.aistudio.openSelectKey) {
      await window.aistudio.openSelectKey();
      setHasKey(true);
      setMessages(prev => [...prev, { role: 'ai', text: "¡Genial! Llave configurada. Ya puedes pedirme lo que necesites." }]);
    }
  };

  const functionDeclarations: FunctionDeclaration[] = [
    {
      name: 'manage_work_days',
      description: 'Crea o actualiza jornadas laborales. Úsalo para rangos o días específicos.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          days: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                date: { type: Type.STRING, description: 'Fecha en formato YYYY-MM-DD' },
                entryTime: { type: Type.STRING, description: 'Hora de entrada HH:MM' },
                exitTime: { type: Type.STRING, description: 'Hora de salida HH:MM' },
                breakStartTime: { type: Type.STRING, description: 'Inicio de descanso HH:MM' },
                breakEndTime: { type: Type.STRING, description: 'Fin de descanso HH:MM' },
                allowance: { type: Type.NUMBER, description: 'Monto de viáticos' },
                isHalfDay: { type: Type.BOOLEAN, description: 'Si es medio turno' },
                isDayOff: { type: Type.BOOLEAN, description: 'Si es día libre' }
              },
              required: ['date']
            }
          }
        },
        required: ['days']
      }
    },
    {
      name: 'delete_work_days',
      description: 'Elimina jornadas laborales por fecha.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          dates: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Lista de fechas YYYY-MM-DD a borrar' }
        },
        required: ['dates']
      }
    }
  ];

  const handleSendMessage = async (customInput?: string) => {
    const text = customInput || input;
    if (!text.trim() || isLoading) return;

    if (!hasKey) {
      setIsOpen(true);
      return;
    }

    setMessages(prev => [...prev, { role: 'user', text }]);
    setInput('');
    setIsLoading(true);

    try {
      // Fix: Ensure initialization follows the guidelines
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const now = new Date();
      const summary = getSummary(workDays, settings, advances);

      const systemInstruction = `Eres Llavpodes Brain, gestor experto de registros laborales en Uruguay.
TIENES CONTROL TOTAL para modificar la base de datos local del usuario mediante herramientas. 
REGLA DE HORAS: El descanso NO es pago y suele ser de 30 minutos (0.5h). 
Si el usuario pide una "Jornada Completa", regístrala de 08:00 a 16:30 con descanso de 12:00 a 12:30 para que el Neto sea exactamente 8hs.
Hoy: ${now.toLocaleDateString('es-UY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
Usuario: ${settings.workerName}.
Estado Actual: Neto ${formatCurrency(summary.netPay)}.
Responde siempre en español de Uruguay, sé breve y directo.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: [{ role: 'user', parts: [{ text }] }],
        config: {
          systemInstruction,
          tools: [{ functionDeclarations }]
        }
      });

      let toolExecuted = false;
      if (response.functionCalls && response.functionCalls.length > 0) {
        toolExecuted = true;
        for (const fc of response.functionCalls) {
          const args = fc.args as any;
          if (fc.name === 'manage_work_days') {
            setWorkDays(prev => {
              const updated = [...prev];
              args.days.forEach((d: any) => {
                const existingIdx = updated.findIndex(ex => ex.date === d.date);
                // Fix: Properly map d.isDayOff to WorkDay.type and remove isDayOff from the object.
                const newEntry: WorkDay = {
                  id: crypto.randomUUID(),
                  date: d.date,
                  type: d.isDayOff ? 'off' : 'work',
                  entryTime: d.entryTime ? `${d.date}T${d.entryTime}:00` : undefined,
                  breakStartTime: d.breakStartTime ? `${d.date}T${d.breakStartTime}:00` : undefined,
                  breakEndTime: d.breakEndTime ? `${d.date}T${d.breakEndTime}:00` : undefined,
                  exitTime: d.exitTime ? `${d.date}T${d.exitTime}:00` : undefined,
                  status: (d.isDayOff || (d.entryTime && d.exitTime)) ? 'complete' : 'incomplete',
                  isManual: true,
                  isHalfDay: !!d.isHalfDay,
                  allowance: d.allowance || 0
                };
                if (existingIdx > -1) updated[existingIdx] = newEntry;
                else updated.unshift(newEntry);
              });
              return updated;
            });
          }
          if (fc.name === 'delete_work_days') {
            setWorkDays(prev => prev.filter(d => !args.dates.includes(d.date)));
          }
        }
        setMessages(prev => [...prev, { role: 'ai', text: "Entendido. He ajustado tus jornadas descontando los descansos correspondientes." }]);
      } else {
        setMessages(prev => [...prev, { role: 'ai', text: response.text || "Operación completada." }]);
      }

    } catch (error: any) {
      console.error(error);
      let msg = "Hubo un problema con el cerebro. Revisa tu conexión.";
      if (error.message?.includes('404') || error.message?.includes('Requested entity was not found')) {
        msg = "Error de conexión con la IA. Por favor, re-selecciona tu llave.";
        setHasKey(false);
      }
      setMessages(prev => [...prev, { role: 'error', text: msg }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 w-16 h-16 bg-slate-900 text-white rounded-[24px] shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40 border-2 border-white/20 group"
      >
        <Sparkles className={`w-8 h-8 ${isLoading ? 'animate-spin' : 'group-hover:animate-pulse'}`} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg h-[90vh] sm:h-[650px] sm:rounded-[2.5rem] flex flex-col shadow-2xl animate-slide-up overflow-hidden border border-slate-100">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-xl shadow-lg"><Bot className="w-5 h-5" /></div>
                <div>
                  <h3 className="font-black uppercase tracking-tight text-sm">Llavpodes Brain</h3>
                  <p className="text-[7px] font-bold text-blue-400 uppercase tracking-widest leading-none">Asistente de Horas Netas</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={clearChat} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-400"><Trash2 className="w-4 h-4" /></button>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X className="w-6 h-6" /></button>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 scrollbar-hide">
              {!hasKey ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-6 animate-fade-in">
                  <div className="w-20 h-20 bg-amber-50 rounded-[32px] flex items-center justify-center text-amber-500 shadow-inner"><Key className="w-10 h-10" /></div>
                  <div className="space-y-2">
                    <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest italic">IA Offline</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase leading-relaxed max-w-[200px]">Necesitas tu API Key para que pueda calcular tus horas netas.</p>
                  </div>
                  <button onClick={handleOpenKeySelector} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl active:scale-95 transition-all">Configurar Llave</button>
                </div>
              ) : (
                messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-4 rounded-3xl text-sm font-bold shadow-sm ${
                      m.role === 'user' ? 'bg-slate-900 text-white rounded-tr-none' 
                      : m.role === 'error' ? 'bg-red-50 text-red-700 border border-red-100 rounded-tl-none'
                      : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                    }`}>
                      {m.text}
                    </div>
                  </div>
                ))
              )}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white p-4 rounded-3xl rounded-tl-none border border-slate-100 flex items-center gap-3">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Calculando horas...</span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-white border-t border-slate-100">
              <div className={`flex gap-2 p-2 rounded-[1.5rem] border transition-all ${!hasKey ? 'bg-slate-50 opacity-50' : 'bg-slate-100 border-slate-200'}`}>
                <input 
                  type="text" 
                  disabled={!hasKey}
                  className="flex-1 bg-transparent px-4 py-2 font-bold text-sm outline-none placeholder:text-slate-400"
                  placeholder="Ej: Registra jornada completa hoy"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button 
                  onClick={() => handleSendMessage()}
                  disabled={isLoading || !input.trim() || !hasKey}
                  className="p-3 bg-blue-600 text-white rounded-full shadow-lg active:scale-90 transition-all disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIAssistant;
