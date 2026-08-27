import { useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { UserPlus, UtensilsCrossed, Users, ChefHat, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import PatientForm from './components/PatientForm';
import CalorieCalculator from './components/CalorieCalculator';
import MacroDistributionStep from './components/MacroDistribution';
import FoodEquivalents from './components/FoodEquivalents';
import DietPlan from './components/DietPlan';
import PatientsPanel from './components/PatientsPanel';
import RecipesPanel from './components/RecipesPanel';
import type { Patient, MetodoCalculo, MacroDistribution, FoodGroup, Meal } from './types';
import { initGrupos } from './utils/foodGroups';
import { activityLevels } from './utils/calculations';
import logoSrc from './assets/logo.png';
import { abrirPlantillaSemanal } from './utils/plantillaSemanal';
import { AuthGate } from './components/Auth';

const STEPS = ['Paciente', 'Calorías', 'Macros', 'Equivalentes', 'Dieta'];

type View = 'wizard' | 'patients' | 'recipes';

export default function App() {
  return (
    <AuthGate>
      {session => <AppShell session={session} />}
    </AuthGate>
  );
}

function AppShell({ session }: { session: Session }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [view, setView] = useState<View>('wizard');
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

  const sidebarItems = [
    { icon: <UserPlus size={20} />, label: 'Nuevo paciente', active: view === 'wizard', onClick: () => { setView('wizard'); setStep(0); } },
    { icon: <UtensilsCrossed size={20} />, label: 'Nueva dieta', active: false, onClick: () => abrirPlantillaSemanal(logoSrc, get, patient, macros, comidas) },
    { icon: <Users size={20} />, label: 'Pacientes atendidos', active: view === 'patients', onClick: () => setView('patients') },
    { icon: <ChefHat size={20} />, label: 'Crear receta', active: view === 'recipes', onClick: () => setView('recipes') },
  ];

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className={`bg-sky-500 flex flex-col items-stretch py-4 gap-2 flex-shrink-0 transition-all duration-200 ${sidebarOpen ? 'w-56 px-3' : 'w-14 px-2 items-center'}`}>
        <button
          title={sidebarOpen ? 'Ocultar menú' : 'Mostrar menú'}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-10 h-10 flex items-center justify-center rounded-xl text-sky-100 hover:bg-white/10 hover:text-white self-end mb-2"
        >
          {sidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
        </button>

        {sidebarItems.map((item, i) => (
          <button
            key={i}
            title={item.label}
            onClick={item.onClick}
            className={`flex items-center gap-3 h-10 rounded-xl transition-colors ${sidebarOpen ? 'px-3 justify-start' : 'w-10 justify-center'} ${
              item.active
                ? 'bg-white/20 text-white'
                : 'text-sky-100 hover:bg-white/10 hover:text-white'
            }`}
          >
            {item.icon}
            {sidebarOpen && <span className="text-sm whitespace-nowrap">{item.label}</span>}
          </button>
        ))}
      </aside>

      <main className="flex-1 flex flex-col">
        {view === 'wizard' && (
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
        )}

        <div className="flex-1 p-8">
          {view === 'patients' && <PatientsPanel />}
          {view === 'recipes' && <RecipesPanel />}

          {view === 'wizard' && step === 0 && (
            <PatientForm
              patient={patient}
              onChange={setPatient}
              onNext={() => setStep(1)}
            />
          )}
          {view === 'wizard' && step === 1 && (
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
          {view === 'wizard' && step === 2 && (
            <MacroDistributionStep
              get={get}
              pesoActual={patient.pesoActual}
              macros={macros}
              onChange={setMacros}
              onNext={() => setStep(3)}
              onBack={() => setStep(1)}
            />
          )}
          {view === 'wizard' && step === 3 && (
            <FoodEquivalents
              get={get}
              macros={macros}
              grupos={grupos}
              onChange={setGrupos}
              onNext={() => setStep(4)}
              onBack={() => setStep(2)}
            />
          )}
          {view === 'wizard' && step === 4 && (
            <DietPlan
              get={get}
              patient={patient}
              macros={macros}
              metodo={metodo}
              grupos={grupos}
              comidas={comidas}
              userId={session.user.id}
              onChange={setComidas}
              onBack={() => setStep(3)}
            />
          )}
        </div>
      </main>
    </div>
  );
}
