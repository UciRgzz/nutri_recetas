import { useState } from 'react';
import { UserPlus, UtensilsCrossed } from 'lucide-react';
import PatientForm from './components/PatientForm';
import CalorieCalculator from './components/CalorieCalculator';
import MacroDistributionStep from './components/MacroDistribution';
import FoodEquivalents from './components/FoodEquivalents';
import DietPlan from './components/DietPlan';
import type { Patient, MetodoCalculo, MacroDistribution, FoodGroup, Meal } from './types';
import { initGrupos } from './utils/foodGroups';
import { activityLevels } from './utils/calculations';
import logoSrc from './assets/logo.png';
import { abrirPlantillaSemanal } from './utils/plantillaSemanal';
import { AuthGate } from './components/Auth';


const STEPS = ['Paciente', 'Calorías', 'Macros', 'Equivalentes', 'Dieta'];

const sidebarItems = [
  { icon: <UserPlus size={20} />, label: 'Nuevo paciente' },
  { icon: <UtensilsCrossed size={20} />, label: 'Nueva dieta', active: true },
];

export default function App() {
  const [step, setStep] = useState(0);
  const [patient, setPatient] = useState<Patient>({
    nombre: '', edad: 0, sexo: 'F', pesoActual: 0, pesoIdeal: 0, talla: 0,
  });
  const [metodo, setMetodo] = useState<MetodoCalculo>('harris-benedict');
  const [actividadFisica, setActividadFisica] = useState(0);
  const [factorActividad, setFactorActividad] = useState(activityLevels[0].factor);
  const [get, setGet] = useState(0);
  const [macros, setMacros] = useState<MacroDistribution>({ hdec: 60, prot: 15, lip: 25 });
  const [grupos, setGrupos] = useState<FoodGroup[]>(initGrupos());
  const [comidas, setComidas] = useState<Meal[]>([]);

  return (
    <AuthGate>
      {() => <div className="flex min-h-screen bg-slate-100">
      <aside className="w-14 bg-sky-500 flex flex-col items-center py-4 gap-2 flex-shrink-0">
        {sidebarItems.map((item, i) => (
  <button
    key={i}
    title={item.label}
    onClick={() => {
      if (item.label === 'Nuevo paciente') setStep(0);
      if (item.label === 'Nueva dieta') abrirPlantillaSemanal(logoSrc, get, patient, macros, comidas);
    }}
    className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors ${
      item.active
        ? 'bg-white/20 text-white'
        : 'text-sky-100 hover:bg-white/10 hover:text-white'
    }`}
  >
    {item.icon}
  </button>
        ))}
      </aside>

      <main className="flex-1 flex flex-col">
        <div className="bg-white border-b border-gray-200 px-8 py-3">
          <div className="flex items-center gap-2 text-sm">
            {STEPS.map((s, i) => (
              <span key={i} className="flex items-center gap-2">
                <button
                  onClick={() => i < step ? setStep(i) : undefined}
                  className={`flex items-center gap-1.5 transition-colors ${
                    i === step
                      ? 'text-blue-600 font-semibold'
                      : i < step
                      ? 'text-blue-400 hover:text-blue-600 cursor-pointer'
                      : 'text-gray-300 cursor-default'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                    i === step ? 'bg-blue-500 text-white' :
                    i < step   ? 'bg-blue-200 text-blue-600' :
                                 'bg-gray-100 text-gray-400'
                  }`}>
                    {i + 1}
                  </span>
                  {s}
                </button>
                {i < STEPS.length - 1 && <span className="text-gray-200">›</span>}
              </span>
            ))}
          </div>
        </div>

        <div className="flex-1 p-8">
          {step === 0 && (
            <PatientForm
              patient={patient}
              onChange={setPatient}
              onNext={() => setStep(1)}
            />
          )}
          {step === 1 && (
            <CalorieCalculator
              patient={patient}
              metodo={metodo}
              actividadFisica={actividadFisica}
              factorActividad={factorActividad}
              get={get}
              onMetodo={setMetodo}
              onActividad={setActividadFisica}
              onFactor={setFactorActividad}
              onGet={setGet}
              onNext={() => setStep(2)}
              onBack={() => setStep(0)}
            />
          )}
          {step === 2 && (
            <MacroDistributionStep
              get={get}
              pesoActual={patient.pesoActual}
              macros={macros}
              onChange={setMacros}
              onNext={() => setStep(3)}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && (
            <FoodEquivalents
              get={get}
              macros={macros}
              grupos={grupos}
              onChange={setGrupos}
              onNext={() => setStep(4)}
              onBack={() => setStep(2)}
            />
          )}
          {step === 4 && (
            <DietPlan
              get={get}
              patient={patient}
              macros={macros}
              metodo={metodo}
              grupos={grupos}
              comidas={comidas}
              onChange={setComidas}
              onBack={() => setStep(3)}
            />
          )}
        </div>
      </main>
      </div>}
    </AuthGate>
  );
}
