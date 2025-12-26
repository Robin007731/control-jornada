
import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, Check, Scale, ShieldAlert, Lock, Info } from 'lucide-react';

interface OnboardingProps {
  onComplete: (name: string) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [terms, setTerms] = useState(false);

  const handleFinish = () => {
    if (name.trim() && terms) {
      onComplete(name);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white overflow-hidden">
      <div className="max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-700">
        <div className="text-center space-y-2">
          <div className="bg-blue-600 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-500/20 border border-white/10 rotate-3">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none">Registro laboral</h1>
          <p className="text-blue-400 text-[9px] font-black uppercase tracking-[0.3em]">Tu tiempo y tus ganancias, bajo tu control.</p>
        </div>

        <div className="bg-white text-gray-900 p-8 rounded-[3rem] shadow-2xl space-y-8 border border-white/10">
          {step === 1 ? (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-lg font-black uppercase italic mb-2 tracking-tight">Bienvenido/a</h2>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed mb-6">Para empezar, introduce tu nombre para personalizar tus reportes y recibos.</p>
                <input 
                  type="text" 
                  placeholder="Ej: Juan Pérez"
                  className="w-full px-6 py-5 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-blue-600 outline-none transition-all font-black text-lg text-slate-800 shadow-inner"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>
              <button 
                disabled={!name.trim()}
                onClick={() => setStep(2)}
                className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-black transition-all disabled:opacity-30 shadow-xl active:scale-95"
              >
                Siguiente Paso <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-900 border-b border-gray-100 pb-4">
                  <Scale className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-black italic uppercase tracking-tighter">Privacidad Total</h2>
                </div>
                
                <div className="bg-gray-50 p-5 rounded-[2rem] text-[9px] leading-relaxed text-gray-500 space-y-4 max-h-60 overflow-y-auto border border-gray-100 scrollbar-hide">
                  <section>
                    <h4 className="font-black text-slate-800 uppercase flex items-center gap-1 mb-1">
                      <Lock className="w-3 h-3 text-blue-600" /> 1. Datos 100% Locales
                    </h4>
                    <p>Toda la información se guarda exclusivamente en tu dispositivo. No hay servidores externos, no hay nube. Si borras el caché de tu navegador, pierdes los datos (usa la opción de Backup periódicamente).</p>
                  </section>

                  <section>
                    <h4 className="font-black text-slate-800 uppercase flex items-center gap-1 mb-1">
                      <ShieldAlert className="w-3 h-3 text-amber-600" /> 2. Control Privado
                    </h4>
                    <p>Esta herramienta es de uso personal del trabajador. No sustituye registros oficiales del MTSS o BPS, es tu propio comprobante y diario laboral.</p>
                  </section>

                  <section>
                    <h4 className="font-black text-slate-800 uppercase flex items-center gap-1 mb-1">
                      <Info className="w-3 h-3 text-blue-400" /> 3. Estimaciones
                    </h4>
                    <p>Los cálculos financieros (BPS 22%, Extras 1.5x) son aproximaciones para control interno y pueden variar según convenios específicos.</p>
                  </section>
                </div>
                
                <label className="flex items-start gap-4 cursor-pointer p-4 bg-blue-50/50 rounded-2xl border border-blue-100 transition-all hover:bg-blue-100/50 group">
                  <div className="relative mt-1">
                    <input 
                      type="checkbox" 
                      className="peer h-5 w-5 opacity-0 absolute"
                      checked={terms}
                      onChange={() => setTerms(!terms)}
                    />
                    <div className="h-5 w-5 bg-white border-2 border-slate-300 rounded-lg peer-checked:bg-blue-600 peer-checked:border-blue-600 flex items-center justify-center transition-all group-hover:border-blue-400">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <span className="text-[9px] font-black text-slate-600 select-none uppercase tracking-tight leading-snug">
                    Entiendo que mis datos son soberanos y acepto las políticas de privacidad.
                  </span>
                </label>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button onClick={() => setStep(1)} className="px-6 py-5 rounded-2xl font-black text-slate-400 hover:text-slate-600 transition-all text-[9px] uppercase tracking-widest">Atrás</button>
                <button 
                  disabled={!terms}
                  onClick={handleFinish}
                  className="flex-1 bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-xl shadow-blue-900/10 disabled:opacity-20 active:scale-95"
                >
                  Confirmar y Entrar
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-[7px] text-slate-500 uppercase font-black tracking-[0.4em] italic opacity-40">
          PRO v3.0 • Uruguay • Nexa Studio
        </p>
      </div>
    </div>
  );
};

export default Onboarding;
