
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import { Sparkles, Send, X, Loader2, Bot, MessageSquare, History, Trash2, ShieldAlert, CheckCircle2 } from 'lucide-react';
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
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedChat = localStorage.getItem('llavpodes_chat_v4');
    if (savedChat) {
      try { setMessages(JSON.parse(savedChat)); } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('llavpodes_chat_v4', JSON.stringify(messages));
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const clearChat = () => {
    if (confirm("¿Borrar el historial de conversación?")) {
      setMessages([]);
      localStorage.removeItem('llavpodes_chat_v4');
    }
  };

  const functionDeclarations: FunctionDeclaration[] = [
    {
      name: 'manage_work_days',
      description: 'Crea o actualiza jornadas. Úsalo para rangos o días específicos.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          days: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                date: { type: Type.STRING, description: 'YYYY-MM-DD' },
                entryTime: { type: Type.STRING, description: 'HH:MM' },
                exitTime: { type: Type.STRING, description: 'HH:MM' },
                allowance: { type: Type.NUMBER },
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
      description: 'Borra jornadas por fecha.',
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
      description: 'Gestiona adelantos de dinero.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          action: { type: Type.STRING, enum: ['add', 'delete'] },
          amount: { type: Type.NUMBER },
          note: { type: Type.STRING }
        },
        required: ['action']
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
      // Inicialización directa según normativa técnica
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const now = new Date();
      const summary = getSummary(workDays, settings, advances);

      const systemInstruction = `Eres Llavpodes Brain, gestor experto de registros laborales en Uruguay.
      TIENES CONTROL TOTAL para modificar datos mediante herramientas. 
      Hoy: ${now.toLocaleDateString('es-UY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      Usuario: ${settings.workerName}. Salario: ${formatCurrency(settings.monthlySalary)}.
      Estado Actual: Neto ${formatCurrency(summary.netPay)}, ${workDays.length} jornadas registradas.
      Responde siempre en español uruguayo, sé breve y eficiente.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', // Pro para mayor fiabilidad en Tool Calling
        contents: [{ role: 'user', parts: [{ text }] }],
        config: {
          systemInstruction,
          tools: [{ functionDeclarations }]
        }
      });

      let handled = false;
      if (response.functionCalls) {
        handled = true;
        for (const fc of response.functionCalls) {
          const args = fc.args as any;
          
          if (fc.name === 'manage_work_days') {
            setWorkDays(prev => {
              const updated = [...prev];
              args.days.forEach((d: any) => {
                const idx = updated.findIndex(ex => ex.date.startsWith(d.date));
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
                if (idx > -1) updated[idx] = entry;
                else updated.unshift(entry);
              });
              return updated;
            });
          }

          if (fc.name === 'delete_work_days') {
            setWorkDays(prev => prev.filter(d => !args.dates.some((dt: string) => d.date.startsWith(dt))));
          }

          if (fc.name === 'manage_advance') {
            if (args.action === 'add') {
              onAddAdvance({ id: crypto.randomUUID(), date: now.toISOString(), amount: args.amount, note: args.note });
            } else {
              const target = advances.find(a => a.amount === args.amount);
              if (target) onDeleteAdvance(target.id);
            }
          }
        }
        setMessages(prev => [...prev, { role: 'ai', text: "¡Listo! He actualizado tus registros según lo pedido." }]);
      } 
      
      if (!handled) {
        setMessages(prev => [...prev, { role: 'ai', text: response.text || "Operación completada con éxito." }]);
      }

    } catch (error: any) {
      console.error("Llavpodes Brain Error:", error);
      let errorMsg = "Hubo un error de conexión con el cerebro de la IA.";
      if (error.message?.includes('API_KEY')) errorMsg = "Problema con la API Key. Por favor, verifica la configuración del servidor.";
      if (error.message?.includes('SAFETY')) errorMsg = "La consulta fue bloqueada por filtros de seguridad.";
      
      setMessages(prev => [...prev, { role: 'error', text: errorMsg }]);
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
        <Sparkles className="w-8 h-8 group-hover:animate-pulse" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg h-[90vh] sm:h-[650px] sm:rounded-[2.5rem] flex flex-col shadow-2xl animate-slide-up overflow-hidden">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-xl"><Bot className="w-5 h-5" /></div>
                <div>
                  <h3 className="font-black uppercase tracking-tight text-sm">Brain 3.0</h3>
                  <p className="text-[7px] font-bold text-blue-400 uppercase tracking-widest">IA de Gestión Activa</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={clearChat} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-400"><Trash2 className="w-4 h-4" /></button>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X className="w-6 h-6" /></button>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 scrollbar-hide">
              {messages.length === 0 && (
                <div className="text-center py-10 space-y-4">
                  <div className="w-16 h-16 bg-blue-50 rounded-[24px] flex items-center justify-center mx-auto"><MessageSquare className="w-8 h-8 text-blue-500" /></div>
                  <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">¿Qué gestionamos hoy?</h4>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Anota semanas enteras, borra errores o consulta tu neto.</p>
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-3xl text-sm font-bold shadow-sm flex gap-3 items-start ${
                    m.role === 'user' ? 'bg-slate-900 text-white rounded-tr-none' 
                    : m.role === 'error' ? 'bg-red-50 text-red-700 border border-red-100 rounded-tl-none'
                    : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                  }`}>
                    {m.role === 'ai' && <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />}
                    {m.role === 'error' && <ShieldAlert className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />}
                    <span>{m.text}</span>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white p-4 rounded-3xl rounded-tl-none border border-slate-100 flex items-center gap-3">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Analizando registros...</span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-white border-t border-slate-100">
              <div className="flex gap-2 bg-slate-100 p-2 rounded-[1.5rem] border border-slate-200">
                <input 
                  type="text" 
                  className="flex-1 bg-transparent px-4 py-2 font-bold text-sm outline-none placeholder:text-slate-400"
                  placeholder="Ej: Anota de lunes a viernes de 8 a 17..."
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
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIAssistant;
