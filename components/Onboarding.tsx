
import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, Check, Scale, ShieldAlert, Lock, Info, ServerOff, Database, Fingerprint, History } from 'lucide-react';

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
          <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none">Registro Laboral</h1>
          <p className="text-blue-400 text-[9px] font-black uppercase tracking-[0.3em]">Tus jornadas y ganancias bajo control</p>
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
                  <h2 className="text-lg font-black italic uppercase tracking-tighter">Acuerdo de Privacidad</h2>
                </div>
                
                <div className="bg-slate-50 p-6 rounded-[2.5rem] text-[10px] leading-relaxed text-gray-600 space-y-6 max-h-80 overflow-y-auto border border-slate-100 scrollbar-hide shadow-inner">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-slate-800 font-black uppercase tracking-widest text-[9px]">
                      <ServerOff className="w-4 h-4 text-blue-600" /> 
                      <span>1. Soberanía de Datos</span>
                    </div>
                    <p className="pl-6 border-l-2 border-blue-100">
                      Registro Laboral es una aplicación de arquitectura **Local-First**. Esto significa que el 100% de tus registros, salarios y fotos se almacenan exclusivamente en la base de datos interna de tu navegador (LocalStorage/IndexedDB). Ningún dato es transmitido a servidores externos.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-slate-800 font-black uppercase tracking-widest text-[9px]">
                      <Fingerprint className="w-4 h-4 text-emerald-600" /> 
                      <span>2. Anonimato y Rastreo</span>
                    </div>
                    <p className="pl-6 border-l-2 border-emerald-100">
                      No utilizamos cookies de seguimiento, píxeles de Facebook ni Google Analytics. Tu actividad dentro de la aplicación es invisible para nosotros y para terceros. La privacidad no es una opción, es la base técnica del proyecto.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-slate-800 font-black uppercase tracking-widest text-[9px]">
                      <History className="w-4 h-4 text-amber-600" /> 
                      <span>3. Responsabilidad de Respaldo</span>
                    </div>
                    <p className="pl-6 border-l-2 border-amber-100">
                      Al no existir una "nube", si pierdes tu dispositivo, borras los datos de navegación o restauras de fábrica tu teléfono, **perderás todos tus registros**. Es responsabilidad única del usuario realizar exportaciones periódicas (Backup JSON) desde el panel de Ajustes.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-slate-800 font-black uppercase tracking-widest text-[9px]">
                      <ShieldAlert className="w-4 h-4 text-red-600" /> 
                      <span>4. Validez Legal</span>
                    </div>
                    <p className="pl-6 border-l-2 border-red-100">
                      Los cálculos financieros (deducciones del 22%, horas extra, etc.) son estimaciones basadas en la normativa general de Uruguay. Esta aplicación es una herramienta de **control personal** y no sustituye los recibos oficiales emitidos por su empleador ni los registros ante el MTSS o BPS.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-slate-800 font-black uppercase tracking-widest text-[9px]">
                      <Lock className="w-4 h-4 text-indigo-600" /> 
                      <span>5. Seguridad de Acceso</span>
                    </div>
                    <p className="pl-6 border-l-2 border-indigo-100">
                      El PIN de acceso configurado por el usuario solo cifra la vista de la interfaz. No protege los datos contra ataques físicos al dispositivo. Se recomienda mantener el sistema operativo actualizado y con bloqueo de pantalla activo.
                    </p>
                  </div>

                  <div className="pt-4 text-center">
                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-300">Última actualización: Agosto 2024</p>
                  </div>
                </div>
                
                <label className="flex items-start gap-4 cursor-pointer p-5 bg-blue-50/50 rounded-3xl border border-blue-100 transition-all hover:bg-blue-100/50 group shadow-sm">
                  <div className="relative mt-1">
                    <input 
                      type="checkbox" 
                      className="peer h-6 w-6 opacity-0 absolute"
                      checked={terms}
                      onChange={() => setTerms(!terms)}
                    />
                    <div className="h-6 w-6 bg-white border-2 border-slate-300 rounded-xl peer-checked:bg-blue-600 peer-checked:border-blue-600 flex items-center justify-center transition-all group-hover:border-blue-400 shadow-sm">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] font-black text-slate-700 select-none uppercase tracking-tight leading-snug">
                      He leído y acepto los términos de soberanía de datos y privacidad local.
                    </span>
                  </div>
                </label>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button onClick={() => setStep(1)} className="px-6 py-5 rounded-2xl font-black text-slate-400 hover:text-slate-600 transition-all text-[9px] uppercase tracking-widest">Atrás</button>
                <button 
                  disabled={!terms}
                  onClick={handleFinish}
                  className="flex-1 bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-xl shadow-blue-900/10 disabled:opacity-20 active:scale-95"
                >
                  Configurar Mi Cuenta
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-[7px] text-slate-500 uppercase font-black tracking-[0.4em] italic opacity-40">
          Professional Security v5.0 • Uruguay • Control Independiente
        </p>
      </div>
    </div>
  );
};

export default Onboarding;
