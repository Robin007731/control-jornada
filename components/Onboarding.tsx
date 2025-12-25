
import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, Check } from 'lucide-react';

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
    <div className="min-h-screen bg-blue-600 flex items-center justify-center p-6 text-white">
      <div className="max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-4">
          <div className="bg-white/20 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-8 backdrop-blur-sm">
            <ShieldCheck className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-black italic tracking-tighter uppercase">Registro laboral</h1>
          <p className="text-blue-100 font-medium">Gestiona tu trabajo, sin complicaciones.</p>
        </div>

        <div className="bg-white text-gray-900 p-8 rounded-3xl shadow-2xl space-y-6">
          {step === 1 ? (
            <>
              <div>
                <h2 className="text-xl font-bold mb-2">Bienvenido</h2>
                <p className="text-gray-500 text-sm mb-6">Para empezar, dinos cómo te llamas para personalizar tu experiencia.</p>
                <input 
                  type="text" 
                  placeholder="Tu nombre completo"
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-gray-100 focus:border-blue-500 outline-none transition-all font-bold text-lg"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <button 
                disabled={!name.trim()}
                onClick={() => setStep(2)}
                className="w-full bg-blue-600 text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente <ArrowRight className="w-5 h-5" />
              </button>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-blue-800">Términos y Condiciones Legales</h2>
                <div className="bg-gray-50 p-4 rounded-xl text-[11px] leading-relaxed text-gray-600 space-y-3 max-h-60 overflow-y-auto border border-gray-200 text-justify">
                  <p className="font-bold border-b border-gray-200 pb-1">1. Naturaleza del Servicio</p>
                  <p>Registro Laboral es una herramienta de uso estrictamente personal y privado destinada al control individual de la jornada de trabajo. No constituye un registro oficial de asistencia ante organismos estatales (como MTSS, BPS) ni sustituye los sistemas de marcado impuestos por el empleador bajo la normativa vigente.</p>
                  
                  <p className="font-bold border-b border-gray-200 pb-1">2. Protección de Datos y Privacidad</p>
                  <p>En cumplimiento con la Ley N° 18.331 de Protección de Datos Personales de Uruguay, se informa que la aplicación funciona en modalidad <strong>"Local-First"</strong>. Toda la información ingresada (nombres, salarios, horarios) reside exclusivamente en la memoria local (LocalStorage) de su dispositivo. El desarrollador no tiene acceso, no recolecta ni almacena datos en servidores externos.</p>
                  
                  <p className="font-bold border-b border-gray-200 pb-1">3. Exactitud de Cálculos</p>
                  <p>Los cálculos de salario líquido, horas extras y descuentos de BPS son estimaciones basadas en parámetros estándar (8 horas diarias, 1.5x recargo por horas extras y 22% de aportes personales). Estos resultados son orientativos y pueden variar según el consejo de salarios, antigüedad, primas por nocturnidad u otros beneficios específicos de su contrato laboral.</p>
                  
                  <p className="font-bold border-b border-gray-200 pb-1">4. Responsabilidad del Usuario</p>
                  <p>El usuario es el único responsable de la veracidad de los datos ingresados y del respaldo de la información. La eliminación de la memoria caché del navegador o el formateo del dispositivo resultará en la pérdida irreversible de los registros si no se han exportado previamente.</p>
                  
                  <p className="font-bold border-b border-gray-200 pb-1">5. Exoneración de Responsabilidad</p>
                  <p>El desarrollador no se responsabiliza por discrepancias legales entre el usuario y su empleador, ni por decisiones financieras tomadas basadas en los cálculos de esta aplicación. Esta herramienta se entrega "tal cual" (as-is) sin garantías de ningún tipo.</p>
                </div>
                
                <label className="flex items-start gap-3 cursor-pointer p-2 group">
                  <div className="relative mt-1">
                    <input 
                      type="checkbox" 
                      className="peer h-5 w-5 opacity-0 absolute"
                      checked={terms}
                      onChange={() => setTerms(!terms)}
                    />
                    <div className="h-5 w-5 bg-white border-2 border-gray-300 rounded-md peer-checked:bg-blue-600 peer-checked:border-blue-600 flex items-center justify-center transition-all group-hover:border-blue-400">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-gray-700 select-none">
                    He leído y acepto los términos legales y la política de privacidad local.
                  </span>
                </label>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="px-6 py-5 rounded-2xl font-bold text-gray-400 hover:text-gray-600 transition-all text-sm uppercase tracking-wide">Atrás</button>
                <button 
                  disabled={!terms}
                  onClick={handleFinish}
                  className="flex-1 bg-green-600 text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition-all shadow-lg shadow-green-200 disabled:opacity-50 disabled:bg-gray-300 disabled:shadow-none"
                >
                  Confirmar y Entrar
                </button>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-[10px] text-blue-200 uppercase font-black tracking-widest">
          Version 1.1.0 • Uruguay Edition • Cumplimiento Ley 18.331
        </p>
      </div>
    </div>
  );
};

export default Onboarding;
