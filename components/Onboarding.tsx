
import React, { useState } from 'react';
import { 
  ShieldCheck, ArrowRight, Check, Scale, ShieldAlert, Lock, 
  ServerOff, History, Wallet, DollarSign, EyeOff, Gavel, 
  Cpu, FileWarning, Globe, HardDrive, UserCheck
} from 'lucide-react';

interface OnboardingProps {
  onComplete: (name: string, salary: number) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [salary, setSalary] = useState('');
  const [terms, setTerms] = useState(false);

  const handleFinish = () => {
    const finalSalary = salary === '' ? 0 : parseFloat(salary);
    onComplete(name, finalSalary);
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
                <h2 className="text-lg font-black uppercase italic mb-2 tracking-tight text-slate-900">Bienvenido/a</h2>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed mb-6">Introduce tu nombre para personalizar tus reportes.</p>
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
          ) : step === 2 ? (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-900 border-b border-gray-100 pb-4">
                  <Gavel className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-black italic uppercase tracking-tighter">Políticas y Privacidad</h2>
                </div>
                
                <div className="bg-slate-50 p-6 rounded-[2.5rem] text-[9px] leading-relaxed text-gray-600 space-y-6 max-h-[400px] overflow-y-auto border border-slate-100 scrollbar-hide shadow-inner">
                  
                  {/* Sección 1: Filosofía Técnica */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-800 font-black uppercase tracking-widest text-[10px]">
                      <ServerOff className="w-4 h-4 text-blue-600" /> 
                      <span>1. Soberanía Local-First</span>
                    </div>
                    <p className="pl-6 border-l-2 border-blue-200">
                      Esta aplicación ha sido diseñada bajo el paradigma <b>Privacy-by-Design</b>. No existe base de datos central. Sus registros (horarios, salarios, adelantos) se almacenan <b>exclusivamente</b> en el almacenamiento interno de su navegador (IndexedDB). El desarrollador no tiene acceso técnico, visual ni administrativo a su información.
                    </p>
                  </div>

                  {/* Sección 2: Uso de IA */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-800 font-black uppercase tracking-widest text-[10px]">
                      <Cpu className="w-4 h-4 text-purple-600" /> 
                      <span>2. Inteligencia Artificial (IA)</span>
                    </div>
                    <p className="pl-6 border-l-2 border-purple-200">
                      Al utilizar <b>Llavpodes Brain</b>, solo el texto de su consulta es enviado a los servicios de Google Gemini para su procesamiento efímero. Estos datos no son utilizados para entrenar modelos públicos ni son almacenados de forma permanente vinculados a su identidad.
                    </p>
                  </div>

                  {/* Sección 3: Seguridad de Acceso */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-800 font-black uppercase tracking-widest text-[10px]">
                      <Lock className="w-4 h-4 text-indigo-600" /> 
                      <span>3. Seguridad de los Datos</span>
                    </div>
                    <p className="pl-6 border-l-2 border-indigo-200">
                      El PIN de acceso cifra la entrada a la interfaz, pero no el almacenamiento físico del dispositivo. Usted es responsable de la seguridad física de su teléfono y de realizar <b>backups externos</b> regularmente para evitar la pérdida de datos por fallos de hardware o limpieza de caché del navegador.
                    </p>
                  </div>

                  {/* Sección 4: Validez Jurídica */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-800 font-black uppercase tracking-widest text-[10px]">
                      <Scale className="w-4 h-4 text-emerald-600" /> 
                      <span>4. Disclaimer Legal</span>
                    </div>
                    <p className="pl-6 border-l-2 border-emerald-200">
                      Esta herramienta proporciona <b>estimaciones</b> basadas en la normativa laboral general de Uruguay (descuentos BPS del 22%, horas extra 150%, etc.). No constituye un consejo legal ni contable profesional. En caso de discrepancia, los únicos documentos válidos son los recibos oficiales de su empleador y registros del MTSS.
                    </p>
                  </div>

                  {/* Sección 5: Anonimato */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-800 font-black uppercase tracking-widest text-[10px]">
                      <EyeOff className="w-4 h-4 text-slate-900" /> 
                      <span>5. Cero Rastreo (No Tracking)</span>
                    </div>
                    <p className="pl-6 border-l-2 border-slate-300">
                      No utilizamos Google Analytics, Facebook Pixel ni cookies de terceros. Su actividad, frecuencia de uso y ubicación geográfica son privadas. Usted es invisible para nosotros.
                    </p>
                  </div>

                  {/* Sección 6: Licencia */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-800 font-black uppercase tracking-widest text-[10px]">
                      <Globe className="w-4 h-4 text-blue-400" /> 
                      <span>6. Propiedad y Licencia</span>
                    </div>
                    <p className="pl-6 border-l-2 border-blue-100 italic">
                      Registro Laboral es una herramienta de uso libre para el trabajador. El software se entrega "tal cual", sin garantías de ningún tipo respecto a su exactitud financiera para casos particulares de consejos de salarios específicos.
                    </p>
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
                      He leído y acepto los términos de soberanía de datos, uso de IA y responsabilidad legal.
                    </span>
                  </div>
                </label>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button onClick={() => setStep(1)} className="px-6 py-5 rounded-2xl font-black text-slate-400 hover:text-slate-600 transition-all text-[9px] uppercase tracking-widest">Atrás</button>
                <button 
                  disabled={!terms}
                  onClick={() => setStep(3)}
                  className="flex-1 bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-black transition-all shadow-xl disabled:opacity-20 active:scale-95"
                >
                  Continuar
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center space-y-4">
                <div className="bg-emerald-50 w-16 h-16 rounded-[1.5rem] flex items-center justify-center mx-auto text-emerald-600 shadow-inner">
                  <Wallet className="w-8 h-8" />
                </div>
                <h2 className="text-lg font-black uppercase italic tracking-tight text-slate-900">Configuración Financiera</h2>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                  Ingresa tu sueldo nominal mensual para habilitar el cálculo de ganancias automáticas. <b>Puedes omitir este paso</b> si prefieres solo registrar horarios.
                </p>
                <div className="relative">
                  <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input 
                    type="number" 
                    placeholder="Sueldo Nominal (Opcional)"
                    className="w-full pl-12 pr-6 py-5 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-emerald-600 outline-none transition-all font-black text-lg text-slate-800 shadow-inner"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <button 
                  onClick={handleFinish}
                  className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-xl active:scale-95"
                >
                  {salary === '' ? 'Finalizar sin sueldo' : 'Activar Control Total'}
                </button>
                <button onClick={() => setStep(2)} className="w-full py-4 font-black text-slate-400 uppercase text-[9px] tracking-widest">Revisar Políticas</button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-[7px] text-slate-500 uppercase font-black tracking-[0.4em] italic opacity-40">
          Uruguay • Estándar Profesional • v5.2 • Privacy-First App
        </p>
      </div>
    </div>
  );
};

export default Onboarding;
