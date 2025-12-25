
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import { Sparkles, Send, X, Loader2, Bot, Wand2, MessageSquare, History, CalendarDays } from 'lucide-react';
import { WorkDay, UserSettings, Advance } from '../types';
import { formatCurrency } from '../utils';

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
  "Anotame ayer de 8 a 12 y de 13 a 17",
  "Borra los últimos 3 días",
  "Anotame 500 de adelanto para hoy",
  "Toda esta semana trabajé de 9 a 18",
  "Cambiame el sueldo a 35000",
  "¿Cuánto llevo ganado este mes?"
];

const AIAssistant: React.FC<AIAssistantProps> = ({ 
  workDays, setWorkDays, settings, setSettings, advances, onAddAdvance, onDeleteAdvance 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const functionDeclarations: FunctionDeclaration[] = [
    {
      name: 'manage_work_day',
      description: 'Crea o actualiza una jornada laboral. Úsala para uno o varios días.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          date: { type: Type.STRING, description: 'Fecha en formato YYYY-MM-DD' },
          entryTime: { type: Type.STRING, description: 'Hora de entrada (HH:MM)' },
          exitTime: { type: Type.STRING, description: 'Hora de salida (HH:MM)' },
          breakStart: { type: Type.STRING, description: 'Inicio descanso (HH:MM). Si el usuario dice "de 8 a 12 y de 14 a 18", el descanso es 12:00.' },
          breakEnd: { type: Type.STRING, description: 'Fin descanso (HH:MM). Siguiendo el ejemplo anterior, el fin es 14:00.' },
          allowance: { type: Type.NUMBER, description: 'Viáticos extras' },
          isHalfDay: { type: Type.BOOLEAN, description: 'Medio turno (usualmente 4hs sin descanso)' }
        },
        required: ['date']
      }
    },
    {
      name: 'delete_work_days',
      description: 'Borra jornadas por rango o fecha específica.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          dates: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING }, 
            description: 'Lista de fechas en formato YYYY-MM-DD a eliminar' 
          }
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
          action: { type: Type.STRING, enum: ['add', 'delete'], description: 'Si se agrega o quita un adelanto' },
          amount: { type: Type.NUMBER },
          note: { type: Type.STRING },
          id: { type: Type.STRING, description: 'ID necesario solo para borrar si se conoce' }
        },
        required: ['action']
      }
    },
    {
      name: 'update_user_profile',
      description: 'Actualiza nombre, sueldo o configuración.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          workerName: { type: Type.STRING },
          monthlySalary: { type: Type.NUMBER },
          passwordHash: { type: Type.STRING }
        }
      }
    }
  ];

  const handleAction = async (textToProcess?: string) => {
    const finalInput = textToProcess || input;
    if (!finalInput.trim() || isLoading) return;

    setMessages(prev => [...prev, { role: 'user', text: finalInput }]);
    if (!textToProcess) setInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const now = new Date();
      
      const systemInstruction = `
        Eres Llavpodes Brain, un asistente experto en gestión laboral uruguaya.
        REGLAS DE INTERPRETACIÓN:
        1. HORARIOS PARTIDOS: Si el usuario dice "8 a 12 y 14 a 18", asume Entrada 08:00, Inicio Descanso 12:00, Fin Descanso 14:00, Salida 18:00.
        2. FECHAS RELATIVAS: Interpreta correctamente "ayer", "el lunes pasado", "toda esta semana", "del 1 al 5".
        3. MULTI-LLAMADAS: Si el usuario pide múltiples días, llama a 'manage_work_day' varias veces.
        4. CÁLCULOS: Responde dudas sobre cuánto lleva ganado basándote en los datos que te paso.
        5. BREVEDAD: Responde de forma ejecutiva y amable.
      `;

      const context = `
        HOY: ${now.toLocaleDateString('es-UY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        USUARIO: ${settings.workerName} | SUELDO: ${settings.monthlySalary}
        ESTADÍSTICAS: ${workDays.length} jornadas, ${advances.length} adelantos registrados.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          { role: 'user', parts: [{ text: `${context}\n\nInstrucción: ${finalInput}` }] }
        ],
        config: {
          systemInstruction,
          tools: [{ functionDeclarations }]
        }
      });

      if (response.functionCalls) {
        for (const fc of response.functionCalls) {
          const args = fc.args as any;
          
          if (fc.name === 'manage_work_day') {
            setWorkDays(prev => {
              const filtered = prev.filter(d => !d.date.includes(args.date));
              const newDay: WorkDay = {
                id: crypto.randomUUID(),
                date: args.date,
                status: (args.entryTime && args.exitTime) ? 'complete' : 'incomplete',
                isManual: true,
                isHalfDay: !!args.isHalfDay,
                entryTime: args.entryTime ? `${args.date}T${args.entryTime}:00` : undefined,
                exitTime: args.exitTime ? `${args.date}T${args.exitTime}:00` : undefined,
                breakStartTime: args.breakStart ? `${args.date}T${args.breakStart}:00` : undefined,
                breakEndTime: args.breakEnd ? `${args.date}T${args.breakEnd}:00` : undefined,
                allowance: args.allowance || 0
              };
              return [newDay, ...filtered];
            });
          }

          if (fc.name === 'delete_work_days') {
            setWorkDays(prev => prev.filter(d => !args.dates.some((date: string) => d.date.includes(date))));
          }

          if (fc.name === 'manage_advance') {
            if (args.action === 'add') {
              onAddAdvance({
                id: crypto.randomUUID(),
                date: new Date().toISOString(),
                amount: args.amount,
                note: args.note
              });
            } else {
              const query = args.note?.toLowerCase() || args.amount?.toString();
              const target = advances.find(a => 
                a.amount.toString().includes(query) || 
                (a.note && a.note.toLowerCase().includes(query))
              );
              if (target) onDeleteAdvance(target.id);
            }
          }

          if (fc.name === 'update_user_profile') {
            setSettings(prev => ({
              ...prev,
              workerName: args.workerName || prev.workerName,
              monthlySalary: args.monthlySalary || prev.monthlySalary,
              passwordHash: args.passwordHash || prev.passwordHash
            }));
          }
        }
        setMessages(prev => [...prev, { role: 'ai', text: "¡Listo! He procesado los cambios solicitados en tu historial." }]);
      } else {
        setMessages(prev => [...prev, { role: 'ai', text: response.text || 'He procesado tu solicitud.' }]);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'ai', text: 'Perdí la conexión con el núcleo. Intenta de nuevo en unos segundos.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 w-16 h-16 bg-blue-600 text-white rounded-2xl shadow-[0_15px_30px_-5px_rgba(37,99,235,0.4)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40 group border-2 border-white/20"
      >
        <div className="absolute inset-0 bg-blue-400 rounded-2xl animate-ping opacity-20 group-hover:opacity-40"></div>
        <Sparkles className="w-7 h-7 relative z-10" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg h-[90vh] sm:h-[700px] sm:rounded-[2.5rem] flex flex-col shadow-2xl animate-slide-up overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
              <div className="flex items-center gap-4">
                <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-500/20 ring-4 ring-blue-600/10">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black uppercase tracking-tight italic text-base leading-none mb-1">Llavpodes Brain</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                    <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Núcleo Activo</p>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30 scroll-smooth">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-8 px-6">
                  <div className="space-y-3 opacity-60">
                    <div className="w-16 h-16 bg-blue-100 rounded-3xl flex items-center justify-center mx-auto">
                      <MessageSquare className="w-8 h-8 text-blue-600" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Asistente de Gestión Total</p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2 w-full">
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-2">Sugerencias rápidas</p>
                    {SUGGESTIONS.map((s, i) => (
                      <button 
                        key={i} 
                        onClick={() => handleAction(s)}
                        className="text-left p-3.5 bg-white border border-slate-100 rounded-2xl text-[11px] font-bold text-slate-600 hover:border-blue-200 hover:bg-blue-50/50 transition-all flex items-center gap-3 group shadow-sm"
                      >
                        <Wand2 className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                  <div className={`max-w-[85%] p-4 rounded-3xl text-[13px] font-bold leading-relaxed shadow-sm ${
                    m.role === 'user' 
                    ? 'bg-slate-900 text-white rounded-tr-none' 
                    : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start animate-pulse">
                  <div className="bg-white p-4 rounded-3xl rounded-tl-none border border-slate-100 flex items-center gap-3">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Interpretando...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-6 bg-white border-t border-slate-100">
              <div className="relative flex items-center">
                <input 
                  type="text" 
                  className="w-full pl-6 pr-14 py-5 bg-slate-100 rounded-[2rem] font-bold text-sm outline-none focus:ring-2 focus:ring-blue-600 transition-all border-none placeholder:text-slate-400"
                  placeholder="Ej: 'Anotame hoy de 8 a 17:30'..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAction()}
                />
                <button 
                  onClick={() => handleAction()}
                  disabled={isLoading || !input.trim()}
                  className="absolute right-2.5 p-3.5 bg-blue-600 text-white rounded-full shadow-lg active:scale-90 transition-all disabled:opacity-20"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex justify-between items-center mt-5 px-2">
                <div className="flex gap-4">
                  <div className="flex items-center gap-1.5 opacity-40">
                    <History className="w-3 h-3" />
                    <span className="text-[7px] font-black uppercase tracking-widest">Historial</span>
                  </div>
                  <div className="flex items-center gap-1.5 opacity-40">
                    <CalendarDays className="w-3 h-3" />
                    <span className="text-[7px] font-black uppercase tracking-widest">Agenda</span>
                  </div>
                </div>
                <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest italic">Llavpodes AI v3.0</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIAssistant;
