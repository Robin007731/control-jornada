
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import { Sparkles, Send, X, Loader2, Bot, MessageSquare, History, CalendarDays, Trash2, AlertCircle, TrendingUp } from 'lucide-react';
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

const SUGGESTIONS = [
  { icon: '📅', text: "Anotame de lunes a viernes de esta semana de 8 a 17", category: "Masivo" },
  { icon: '💸', text: "Anotame un adelanto de 1200 por favor", category: "Dinero" },
  { icon: '🧹', text: "Borra todas las jornadas de la semana pasada", category: "Limpiar" },
  { icon: '📊', text: "¿Cuánto llevo ganado neto hasta hoy?", category: "Consulta" },
  { icon: '⚙️', text: "Subime el sueldo a 35000", category: "Ajustes" },
];

const AIAssistant: React.FC<AIAssistantProps> = ({ 
  workDays, setWorkDays, settings, setSettings, advances, onAddAdvance, onDeleteAdvance 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai' | 'error'; text: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Persistence for chat history
  useEffect(() => {
    const savedChat = localStorage.getItem('llavpodes_chat_v3');
    if (savedChat) {
      try { setMessages(JSON.parse(savedChat)); } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('llavpodes_chat_v3', JSON.stringify(messages));
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const clearChat = () => {
    if (confirm("¿Borrar el historial de conversación?")) {
      setMessages([]);
      localStorage.removeItem('llavpodes_chat_v3');
    }
  };

  const functionDeclarations: FunctionDeclaration[] = [
    {
      name: 'manage_work_days',
      description: 'Crea, actualiza o agrega múltiples jornadas laborales. Úsalo para rangos de fechas (ej. "toda la semana") o días específicos.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          days: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                date: { type: Type.STRING, description: 'Fecha en formato YYYY-MM-DD' },
                entryTime: { type: Type.STRING, description: 'HH:MM (24h)' },
                exitTime: { type: Type.STRING, description: 'HH:MM (24h)' },
                allowance: { type: Type.NUMBER, description: 'Viáticos adicionales si los hay' },
                isHalfDay: { type: Type.BOOLEAN }
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
      description: 'Elimina jornadas laborales por un rango de fechas o fechas específicas.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          dates: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Lista de fechas YYYY-MM-DD a borrar' }
        },
        required: ['dates']
      }
    },
    {
      name: 'manage_advance',
      description: 'Agrega o elimina adelantos de sueldo.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          action: { type: Type.STRING, enum: ['add', 'delete'], description: 'Si se va a agregar o borrar un adelanto' },
          amount: { type: Type.NUMBER, description: 'Monto del adelanto' },
          note: { type: Type.STRING, description: 'Concepto o fecha del adelanto' },
          id: { type: Type.STRING, description: 'ID del adelanto si es para borrar' }
        },
        required: ['action']
      }
    },
    {
      name: 'update_user_settings',
      description: 'Actualiza el perfil del usuario (nombre, sueldo, modo simplificado).',
      parameters: {
        type: Type.OBJECT,
        properties: {
          workerName: { type: Type.STRING },
          monthlySalary: { type: Type.NUMBER },
          simplifiedMode: { type: Type.BOOLEAN }
        }
      }
    }
  ];

  const handleSendMessage = async (customInput?: string) => {
    const text = customInput || input;
    if (!text.trim() || isLoading) return;

    setMessages(prev => [...prev, { role: 'user', text }]);
    setInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const now = new Date();
      const summary = getSummary(workDays, settings, advances);

      const systemInstruction = `Eres Llavpodes Brain, el cerebro de gestión de una app de registro laboral en Uruguay.
      TIENES CONTROL TOTAL para modificar los datos del usuario mediante las herramientas provistas.
      
      DATOS ACTUALES DEL SISTEMA:
      - Hoy es: ${now.toLocaleDateString('es-UY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      - Trabajador: ${settings.workerName}
      - Sueldo Nominal: ${formatCurrency(settings.monthlySalary)}
      - Resumen del mes: Neto ${formatCurrency(summary.netPay)}, Horas Extra: ${summary.totalExtraHours}h, Adelantos: ${formatCurrency(summary.totalAdvances)}.
      - Registros existentes: ${workDays.length} jornadas guardadas.
      
      REGLAS DE ORO:
      1. Si el usuario pide anotar días (ej. "anotame de lunes a viernes"), calcula las fechas correctas basándote en que hoy es ${now.toISOString().split('T')[0]}.
      2. Si te piden borrar, busca las fechas que coincidan.
      3. Sé extremadamente conciso. Si ejecutas una acción, confírmala brevemente.
      4. Si el usuario pregunta "¿Cuánto gano?", usa los datos del resumen provisto arriba.
      5. Siempre responde en español uruguayo (natural, profesional pero cercano).`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text }] }],
        config: {
          systemInstruction,
          tools: [{ functionDeclarations }]
        }
      });

      if (response.functionCalls) {
        for (const fc of response.functionCalls) {
          const args = fc.args as any;
          
          if (fc.name === 'manage_work_days') {
            setWorkDays(prev => {
              const newDays = [...prev];
              args.days.forEach((d: any) => {
                const idx = newDays.findIndex(existing => existing.date.includes(d.date));
                const entry = {
                  id: crypto.randomUUID(),
                  date: d.date,
                  entryTime: d.entryTime ? `${d.date}T${d.entryTime}:00` : undefined,
                  exitTime: d.exitTime ? `${d.date}T${d.exitTime}:00` : undefined,
                  status: (d.entryTime && d.exitTime) ? 'complete' : 'incomplete',
                  isManual: true,
                  isHalfDay: !!d.isHalfDay,
                  allowance: d.allowance || 0
                } as WorkDay;

                if (idx > -1) newDays[idx] = entry;
                else newDays.unshift(entry);
              });
              return newDays;
            });
          }

          if (fc.name === 'delete_work_days') {
            setWorkDays(prev => prev.filter(d => !args.dates.some((date: string) => d.date.includes(date))));
          }

          if (fc.name === 'manage_advance') {
            if (args.action === 'add') {
              onAddAdvance({
                id: crypto.randomUUID(),
                date: now.toISOString(),
                amount: args.amount,
                note: args.note || 'Agregado por IA'
              });
            } else {
              // Buscar adelanto por monto o nota si no hay ID
              const target = advances.find(a => a.amount === args.amount || (args.note && a.note?.includes(args.note)));
              if (target) onDeleteAdvance(target.id);
            }
          }

          if (fc.name === 'update_user_settings') {
            setSettings(prev => ({
              ...prev,
              workerName: args.workerName || prev.workerName,
              monthlySalary: args.monthlySalary || prev.monthlySalary,
              simplifiedMode: args.simplifiedMode !== undefined ? args.simplifiedMode : prev.simplifiedMode
            }));
          }
        }
        setMessages(prev => [...prev, { role: 'ai', text: "¡Entendido! Ya realicé los cambios en tu registro. ¿Necesitas algo más?" }]);
      } else {
        setMessages(prev => [...prev, { role: 'ai', text: response.text || "No pude procesar eso, ¿podrías repetirlo?" }]);
      }

    } catch (error: any) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'error', text: "Hubo un problema de conexión. Revisa tu API Key o conexión a internet." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 w-16 h-16 bg-slate-900 text-white rounded-[24px] shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40 border-2 border-white/20 group"
      >
        <Sparkles className="w-8 h-8 group-hover:animate-pulse" />
        {messages.length > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
            <span className="text-[10px] font-black">{messages.length}</span>
          </div>
        )}
      </button>

      {/* Chat Interface Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg h-[90vh] sm:h-[700px] sm:rounded-[3rem] flex flex-col shadow-[0_30px_100px_rgba(0,0,0,0.5)] animate-slide-up overflow-hidden">
            {/* Header */}
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-xl">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black uppercase tracking-tight text-sm">Llavpodes Brain</h3>
                  <p className="text-[8px] font-bold text-blue-400 uppercase tracking-widest">Gestión Inteligente Activa</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={clearChat} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-400">
                  <Trash2 className="w-4 h-4" />
                </button>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Chat Body */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 scrollbar-hide">
              {messages.length === 0 && (
                <div className="text-center py-10 space-y-6">
                  <div className="w-20 h-20 bg-blue-50 rounded-[30px] flex items-center justify-center mx-auto shadow-inner">
                    <MessageSquare className="w-10 h-10 text-blue-500" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">¿Cómo puedo ayudarte?</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Puedo anotar días, borrar errores o decirte cuánto vas ganando.</p>
                  </div>
                  
                  <div className="grid gap-3 px-4">
                    {SUGGESTIONS.map((s, i) => (
                      <button 
                        key={i} 
                        onClick={() => handleSendMessage(s.text)}
                        className="p-4 bg-white border border-slate-100 rounded-2xl text-left hover:border-blue-400 hover:bg-blue-50/50 transition-all flex items-center gap-3 group shadow-sm"
                      >
                        <span className="text-xl">{s.icon}</span>
                        <div>
                          <p className="text-[11px] font-black text-slate-800 leading-tight">{s.text}</p>
                          <span className="text-[7px] font-black text-blue-500 uppercase tracking-widest">{s.category}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-3xl text-sm font-bold shadow-sm ${
                    m.role === 'user' 
                    ? 'bg-slate-900 text-white rounded-tr-none' 
                    : m.role === 'error'
                    ? 'bg-red-50 text-red-700 border border-red-100 rounded-tl-none'
                    : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white p-4 rounded-3xl rounded-tl-none border border-slate-100 flex items-center gap-3">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Procesando comando...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Footer */}
            <div className="p-6 bg-white border-t border-slate-100">
              <div className="flex gap-2 bg-slate-100 p-2 rounded-[2rem] border border-slate-200">
                <input 
                  type="text" 
                  className="flex-1 bg-transparent px-4 py-2 font-bold text-sm outline-none placeholder:text-slate-400"
                  placeholder="Escribe un comando..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button 
                  onClick={() => handleSendMessage()}
                  disabled={isLoading || !input.trim()}
                  className="p-3 bg-blue-600 text-white rounded-full shadow-lg active:scale-90 transition-all disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-4 flex justify-center gap-4 opacity-30">
                <div className="flex items-center gap-1">
                  <History className="w-3 h-3" />
                  <span className="text-[8px] font-black uppercase tracking-widest">Historial</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  <span className="text-[8px] font-black uppercase tracking-widest">Finanzas</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIAssistant;
