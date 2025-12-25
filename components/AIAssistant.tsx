
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import { Sparkles, Send, X, Loader2, Bot, Wand2, MessageSquare, History, CalendarDays, Trash2, AlertCircle } from 'lucide-react';
import { WorkDay, UserSettings, Advance } from '../types';

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
  { icon: '📅', text: "Anotame ayer de 8 a 12 y de 13 a 17", category: "Jornada" },
  { icon: '💸', text: "Anotame 500 de adelanto para hoy", category: "Dinero" },
  { icon: '🧹', text: "Borra los últimos 3 días", category: "Limpiar" },
  { icon: '📈', text: "¿Cuánto llevo ganado este mes?", category: "Consulta" },
  { icon: '⚙️', text: "Cambiame el sueldo a 35000", category: "Ajustes" },
  { icon: '🕒', text: "Toda esta semana trabajé de 9 a 18", category: "Masivo" },
];

const AIAssistant: React.FC<AIAssistantProps> = ({ 
  workDays, setWorkDays, settings, setSettings, advances, onAddAdvance, onDeleteAdvance 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai' | 'error'; text: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedChat = localStorage.getItem('llavpodes_chat_history');
    if (savedChat) {
      try {
        setMessages(JSON.parse(savedChat));
      } catch (e) {
        console.error("Error loading chat history", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('llavpodes_chat_history', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const clearHistory = () => {
    if (confirm("¿Borrar historial de chat?")) {
      setMessages([]);
      localStorage.removeItem('llavpodes_chat_history');
    }
  };

  const functionDeclarations: FunctionDeclaration[] = [
    {
      name: 'manage_work_day',
      description: 'Crea o actualiza jornadas laborales. Si faltan datos de descanso en un horario partido, calcúlalos.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          date: { type: Type.STRING, description: 'Fecha YYYY-MM-DD' },
          entryTime: { type: Type.STRING, description: 'HH:MM' },
          exitTime: { type: Type.STRING, description: 'HH:MM' },
          breakStart: { type: Type.STRING, description: 'HH:MM' },
          breakEnd: { type: Type.STRING, description: 'HH:MM' },
          allowance: { type: Type.NUMBER },
          isHalfDay: { type: Type.BOOLEAN }
        },
        required: ['date']
      }
    },
    {
      name: 'delete_work_days',
      description: 'Elimina jornadas laborales por sus fechas.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          dates: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ['dates']
      }
    },
    {
      name: 'manage_advance',
      description: 'Gestiona adelantos de sueldo.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          action: { type: Type.STRING, enum: ['add', 'delete'] },
          amount: { type: Type.NUMBER },
          note: { type: Type.STRING }
        },
        required: ['action']
      }
    },
    {
      name: 'update_profile',
      description: 'Actualiza ajustes del usuario.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          workerName: { type: Type.STRING },
          monthlySalary: { type: Type.NUMBER }
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
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("API Key no configurada.");

      const ai = new GoogleGenAI({ apiKey });
      const now = new Date();
      
      const systemInstruction = `Eres Llavpodes Brain, el cerebro de gestión de esta aplicación.
        CONTEXTO ACTUAL:
        - Fecha de hoy: ${now.toLocaleDateString('es-UY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        - Usuario: ${settings.workerName}
        - Sueldo mensual: ${settings.monthlySalary}
        - Datos actuales: ${workDays.length} jornadas, ${advances.length} adelantos.

        REGLAS:
        1. Resuelve horarios partidos (ej. 8-12 y 14-18) asignando el descanso automáticamente.
        2. Si el usuario pide algo masivo (ej. "toda la semana"), usa múltiples llamadas a herramientas.
        3. Sé extremadamente breve y eficiente.
        4. Si no puedes realizar una acción, explica por qué brevemente.`;

      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: [{ role: 'user', parts: [{ text: finalInput }] }],
        config: {
          systemInstruction,
          tools: [{ functionDeclarations }]
        }
      });

      if (!response) throw new Error("Sin respuesta del servicio de IA.");

      if (response.functionCalls && response.functionCalls.length > 0) {
        for (const fc of response.functionCalls) {
          const args = fc.args as any;
          if (fc.name === 'manage_work_day') {
            setWorkDays(prev => {
              const filtered = prev.filter(d => !d.date.includes(args.date));
              return [{
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
              } as WorkDay, ...filtered];
            });
          }
          if (fc.name === 'delete_work_days') {
            setWorkDays(prev => prev.filter(d => !args.dates.some((date: string) => d.date.includes(date))));
          }
          if (fc.name === 'manage_advance') {
            if (args.action === 'add') {
              onAddAdvance({ id: crypto.randomUUID(), date: now.toISOString(), amount: args.amount, note: args.note });
            } else {
              const query = args.note?.toLowerCase() || args.amount?.toString();
              const target = advances.find(a => a.amount.toString().includes(query) || (a.note && a.note.toLowerCase().includes(query)));
              if (target) onDeleteAdvance(target.id);
            }
          }
          if (fc.name === 'update_profile') {
            setSettings(prev => ({ ...prev, workerName: args.workerName || prev.workerName, monthlySalary: args.monthlySalary || prev.monthlySalary }));
          }
        }
        setMessages(prev => [...prev, { role: 'ai', text: "Cambios aplicados correctamente." }]);
      } else {
        const textResponse = response.text || "No pude interpretar la acción, intenta de nuevo.";
        setMessages(prev => [...prev, { role: 'ai', text: textResponse }]);
      }
    } catch (error: any) {
      console.error("AI Assistant Error:", error);
      setMessages(prev => [...prev, { role: 'error', text: `Error: ${error.message || "Fallo en la conexión"}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 w-16 h-16 bg-gradient-to-tr from-blue-700 to-blue-500 text-white rounded-[22px] shadow-[0_15px_35px_rgba(37,99,235,0.4)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40 group border-2 border-white/30"
      >
        <Sparkles className="w-7 h-7" />
        {messages.length > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center shadow-lg">
            <span className="text-[8px] font-black">{messages.length}</span>
          </div>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg h-[95vh] sm:h-[750px] sm:rounded-[3rem] flex flex-col shadow-2xl animate-slide-up overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
              <div className="flex items-center gap-4">
                <div className="bg-blue-600 p-2.5 rounded-2xl shadow-xl shadow-blue-500/20">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-black uppercase tracking-tight italic text-base">Llavpodes Brain</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                    <p className="text-[7px] font-black text-blue-400 uppercase tracking-widest">Flash Engine</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={clearHistory} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Chat Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/20 scrollbar-hide">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-10 px-4">
                  <div className="space-y-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-blue-100 rounded-[30px] flex items-center justify-center mx-auto shadow-inner">
                      <MessageSquare className="w-10 h-10 text-blue-600" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Núcleo listo</h4>
                      <p className="text-[10px] font-medium text-slate-400 max-w-[200px] mx-auto leading-relaxed italic">Sistema de gestión inteligente v1.5 Flash</p>
                    </div>
                  </div>
                  
                  {/* Suggestions Carousel */}
                  <div className="w-full space-y-4">
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest text-left pl-2">Sugerencias rápidas</p>
                    <div className="flex overflow-x-auto gap-3 pb-4 px-2 scrollbar-hide -mx-6 px-6">
                      {SUGGESTIONS.map((s, i) => (
                        <button 
                          key={i} 
                          onClick={() => handleAction(s.text)}
                          className="flex-shrink-0 w-[180px] p-5 bg-white border border-slate-100 rounded-[2rem] text-left hover:border-blue-300 hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden shadow-sm"
                        >
                          <div className="text-2xl mb-3">{s.icon}</div>
                          <span className="text-[8px] font-black uppercase text-blue-500 tracking-widest mb-1 block">{s.category}</span>
                          <p className="text-[11px] font-bold text-slate-700 leading-snug line-clamp-2">{s.text}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                  <div className={`max-w-[85%] p-4 rounded-[1.5rem] text-[13px] font-bold leading-relaxed shadow-sm ${
                    m.role === 'user' 
                    ? 'bg-slate-900 text-white rounded-tr-none' 
                    : m.role === 'error'
                    ? 'bg-red-50 text-red-700 border border-red-100 rounded-tl-none flex items-start gap-2'
                    : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                  }`}>
                    {m.role === 'error' && <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                    {m.text}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white p-4 rounded-[1.5rem] rounded-tl-none border border-slate-100 flex items-center gap-3 shadow-sm">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Procesando...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-6 bg-white border-t border-slate-100 pb-10 sm:pb-6">
              <div className="relative flex items-center">
                <input 
                  type="text" 
                  className="w-full pl-6 pr-14 py-5 bg-slate-100 rounded-full font-bold text-sm outline-none focus:ring-2 focus:ring-blue-600 transition-all border-none placeholder:text-slate-400 shadow-inner"
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
              
              <div className="flex justify-between items-center mt-5 px-4 opacity-40">
                <div className="flex gap-4">
                  <div className="flex items-center gap-1.5">
                    <History className="w-3 h-3" />
                    <span className="text-[7px] font-black uppercase tracking-widest">Historial</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="w-3 h-3" />
                    <span className="text-[7px] font-black uppercase tracking-widest">Agenda</span>
                  </div>
                </div>
                <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest italic">Llavpodes PRO v1.5 Flash</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIAssistant;
