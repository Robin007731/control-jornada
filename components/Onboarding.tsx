
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
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white">
      <div className="max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-4">
          <div className="bg-white/10 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-8 backdrop-blur-md border border-white/20">
            <ShieldCheck className="w-12 h-12 text-blue-400" />
          </div>
          <h1 className="text-4xl font-black italic tracking-tighter uppercase">Registro laboral</h1>
          <p className="text-slate-400 font-medium">Tu tiempo y tus ganancias, bajo tu control.</p>
        </div>

        <div className="bg-white text-gray-900 p-8 rounded-[2.5rem] shadow-2xl space-y-6">
          {step === 1 ? (
            <>
              <div>
                <h2 className="text-xl font-bold mb-2">Bienvenido/a</h2>
                <p className="text-gray-500 text-sm mb-6">Para empezar, dinos cómo te llamas para personalizar tus reportes y recibos.</p>
                <input 
                  type="text" 
                  placeholder="Tu nombre completo"
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-gray-100 focus:border-blue-600 outline-none transition-all font-bold text-lg"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <button 
                disabled={!name.trim()}
                onClick={() => setStep(2)}
                className="w-full bg-slate-900 text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl"
              >
                Continuar a Políticas <ArrowRight className="w-5 h-5" />
              </button>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-900 border-b border-gray-100 pb-2">
                  <Scale className="w-5 h-5" />
                  <h2 className="text-xl font-black uppercase tracking-tighter">Políticas y Privacidad</h2>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-2xl text-[10px] leading-relaxed text-gray-600 space-y-4 max-h-72 overflow-y-auto border border-gray-100">
                  <section>
                    <h4 className="font-black text-slate-800 uppercase flex items-center gap-1 mb-1">
                      <Lock className="w-3 h-3 text-blue-600" /> 1. Soberanía de Datos y Privacidad
                    </h4>
                    <p>En cumplimiento con la <strong>Ley N° 18.331 de Protección de Datos Personales y Acción de "Habeas Data" de Uruguay</strong>, esta aplicación opera bajo el principio de soberanía absoluta del usuario. Los datos no se transmiten, no se venden ni se almacenan en la nube. La información reside únicamente en el almacenamiento local (LocalStorage) de su navegador/dispositivo.</p>
                  </section>

                  <section>
                    <h4 className="font-black text-slate-800 uppercase flex items-center gap-1 mb-1">
                      <ShieldAlert className="w-3 h-3 text-red-600" /> 2. Deslinde de Responsabilidad Oficial
                    </h4>
                    <p>Esta herramienta es de uso personal y de control privado. <strong>No sustituye</strong> al sistema oficial de registro de asistencia de su empleador ni a las planillas exigidas por el Ministerio de Trabajo y Seguridad Social (MTSS) o el Banco de Previsión Social (BPS). Es una ayuda memoria para el trabajador.</p>
                  </section>

                  <section>
                    <h4 className="font-black text-slate-800 uppercase flex items-center gap-1 mb-1">
                      <Info className="w-3 h-3 text-amber-600" /> 3. Exactitud de los Cálculos
                    </h4>
                    <p>Los montos de salario neto, aportes de BPS (estimados al 22%) y horas extras son cálculos matemáticos basados en los datos ingresados por el usuario. No consideran variables específicas como: antigüedad, presentismo, salario vacacional, aguinaldo prorrateado, IRPF o convenios específicos de Consejos de Salarios.</p>
                  </section>

                  <section>
                    <h4 className="font-black text-slate-800 uppercase flex items-center gap-1 mb-1">
                      <Check className="w-3 h-3 text-green-600" /> 4. Derechos ARCO
                    </h4>
                    <p>Usted mantiene en todo momento el derecho de Acceso, Rectificación, Cancelación y Oposición. Al ser una app local, estos derechos se ejercen directamente editando o eliminando la información desde el menú de Ajustes o el Historial de la aplicación.</p>
                  </section>

                  <section>
                    <h4 className="font-black text-slate-800 uppercase flex items-center gap-1 mb-1">
                       5. Gestión de Cookies y Almacenamiento
                    </h4>
                    <p>La aplicación utiliza la tecnología "LocalStorage" para persistir su sesión y datos laborales sin necesidad de cuenta. Al borrar los datos de navegación o la caché del dispositivo, se eliminará permanentemente toda la información de la app si no se realizó un respaldo previo.</p>
                  </section>

                  <section className="pt-2 border-t border-gray-200">
                    <p className="italic text-gray-400">Desarrollado por Nexa Studio bajo estándares de transparencia y ética digital.</p>
                  </section>
                </div>
                
                <label className="flex items-start gap-3 cursor-pointer p-3 bg-slate-50 rounded-2xl border border-gray-100 group transition-colors hover:bg-slate-100">
                  <div className="relative mt-1">
                    <input 
                      type="checkbox" 
                      className="peer h-5 w-5 opacity-0 absolute"
                      checked={terms}
                      onChange={() => setTerms(!terms)}
                    />
                    <div className="h-5 w-5 bg-white border-2 border-gray-300 rounded-lg peer-checked:bg-slate-900 peer-checked:border-slate-900 flex items-center justify-center transition-all group-hover:border-slate-400">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-slate-700 select-none uppercase tracking-tight leading-tight">
                    Entiendo que mis datos son 100% locales y acepto las políticas de privacidad detalladas.
                  </span>
                </label>
              </div>
              
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="px-6 py-5 rounded-2xl font-black text-gray-400 hover:text-gray-600 transition-all text-[10px] uppercase tracking-widest">Atrás</button>
                <button 
                  disabled={!terms}
                  onClick={handleFinish}
                  className="flex-1 bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-xl shadow-blue-900/10 disabled:opacity-50 disabled:bg-gray-300 disabled:shadow-none"
                >
                  Confirmar y Entrar
                </button>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-[10px] text-slate-500 uppercase font-black tracking-widest">
          Versión 2.5.0 • Uruguay • Nexa Studio
        </p>
      </div>
    </div>
  );
};

export default Onboarding;
