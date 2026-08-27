import { useState } from 'react';
import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { LucideIcon } from 'lucide-react';
import {
  UserPlus, Users, ChefHat, PanelLeftClose, PanelLeftOpen,
  Home, Calendar, BookOpen, Apple, UtensilsCrossed, Zap,
  TrendingUp, Scale, BarChart3, Receipt, Settings, HelpCircle,
  PlayCircle, LogOut,
} from 'lucide-react';
import PatientForm from './components/PatientForm';
import CalorieCalculator from './components/CalorieCalculator';
import MacroDistributionStep from './components/MacroDistribution';
import FoodEquivalents from './components/FoodEquivalents';
import DietPlan from './components/DietPlan';
import PatientsPanel from './components/PatientsPanel';
import RecipesPanel from './components/RecipesPanel';
import ComingSoonPanel from './components/ComingSoonPanel';
import CalendarPanel from './components/CalendarPanel';
import MyRecipesPanel from './components/MyRecipesPanel';
import HomePanel from './components/HomePanel';
import type { Patient, MetodoCalculo, MacroDistribution, FoodGroup, Meal } from './types';
import { initGrupos } from './utils/foodGroups';
import { activityLevels } from './utils/calculations';
import { AuthGate } from './components/Auth';
import { supabase } from './lib/supabase';
import logoSrc from './assets/logo.png';

const STEPS = ['Paciente', 'Calorías', 'Macros', 'Equivalentes', 'Dieta'];

type View = 'home' | 'wizard' | 'patients' | 'recipes' | 'calendar' | 'my-recipes' | 'placeholder';

interface PlaceholderInfo {
  icon: ReactNode;
  title: string;
  description: string;
}

export default function App() {
  return (
    <AuthGate>
      {session => <AppShell session={session} />}
    </AuthGate>
  );
}

const blankPatient = (): Patient => ({ nombre: '', edad: 0, sexo: 'F', pesoActual: 0, pesoIdeal: 0, talla: 0 });

function AppShell({ session }: { session: Session }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [view, setView] = useState<View>('home');
  const [placeholder, setPlaceholder] = useState<PlaceholderInfo | null>(null);
  const [recipeStarted, setRecipeStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [patient, setPatient] = useState<Patient>(blankPatient);
  const [metodo, setMetodo] = useState<MetodoCalculo>('harris-benedict');
  const [actividadFisica, setActividadFisica] = useState(0);
  const [factorActividad, setFactorActividad] = useState(activityLevels[0].factor);
  const [get, setGet] = useState(0);
  const [macros, setMacros] = useState<MacroDistribution>({ hdec: 60, prot: 15, lip: 25 });
  const [grupos, setGrupos] = useState<FoodGroup[]>(initGrupos());
  const [comidas, setComidas] = useState<Meal[]>([]);

  const inWizard = view === 'wizard' || (view === 'recipes' && recipeStarted);

  const startFresh = () => {
    setPatient(blankPatient());
    setMetodo('harris-benedict');
    setActividadFisica(0);
    setFactorActividad(activityLevels[0].factor);
    setGet(0);
    setMacros({ hdec: 60, prot: 15, lip: 25 });
    setGrupos(initGrupos());
    setComidas([]);
    setStep(0);
  };

  const openPlaceholder = (icon: ReactNode, title: string, description: string) => {
    setView('placeholder');
    setPlaceholder({ icon, title, description });
  };

  const pending = (label: string, Icon: LucideIcon, description: string) => ({
    icon: <Icon size={20} />,
    label,
    active: view === 'placeholder' && placeholder?.title === label,
    onClick: () => openPlaceholder(<Icon size={32} className="text-emerald-500" />, label, description),
  });

  const sidebarItems = [
    { icon: <Home size={20} />, label: 'Inicio', active: view === 'home', onClick: () => setView('home') },
    { icon: <UserPlus size={20} />, label: 'Nuevo paciente', active: view === 'wizard', onClick: () => { setView('wizard'); setStep(0); } },
    { icon: <Users size={20} />, label: 'Mis pacientes', active: view === 'patients', onClick: () => setView('patients') },
    { icon: <Calendar size={20} />, label: 'Calendario de citas', active: view === 'calendar', onClick: () => setView('calendar') },
    { icon: <ChefHat size={20} />, label: 'Crear receta', active: view === 'recipes', onClick: () => { setView('recipes'); setRecipeStarted(false); } },
    { icon: <BookOpen size={20} />, label: 'Mis recetas', active: view === 'my-recipes', onClick: () => setView('my-recipes') },
    pending('Mis alimentos', Apple, 'Administra tu base de datos de alimentos y equivalencias.'),
    pending('Dietas y platos', UtensilsCrossed, 'Plantillas de dietas y platillos listos para asignar.'),
    pending('Dietas instantáneas', Zap, 'Genera una dieta express a partir de una plantilla.'),
    pending('Curvas de crecimiento', TrendingUp, 'Sigue el crecimiento y desarrollo de pacientes pediátricos.'),
    pending('Equivalentes automáticos', Scale, 'Calculadora rápida de equivalentes fuera del asistente de dieta.'),
    pending('Reportes poblacionales', BarChart3, 'Estadísticas agregadas de todos tus pacientes.'),
    pending('Reportes de pagos', Receipt, 'Control de cobros y pagos de consultas.'),
    pending('Configuración', Settings, 'Ajustes de tu cuenta y del consultorio.'),
    pending('Ayuda', HelpCircle, 'Centro de ayuda y preguntas frecuentes.'),
    pending('Videos', PlayCircle, 'Tutoriales en video sobre el uso del sistema.'),
    { icon: <LogOut size={20} />, label: 'Salir', active: false, onClick: () => { void supabase?.auth.signOut(); } },
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-emerald-50 via-slate-50 to-amber-50">
      <aside className={`bg-emerald-600 flex flex-col items-stretch py-4 gap-2 flex-shrink-0 h-screen sticky top-0 overflow-y-auto transition-all duration-200 ${sidebarOpen ? 'w-56 px-3' : 'w-14 px-2 items-center'}`}>
        <div className={`flex items-center mb-2 ${sidebarOpen ? 'justify-between px-1' : 'flex-col gap-2'}`}>
          {sidebarOpen && (
            <img src={logoSrc} alt="Lic. Nutrición" className="h-8 w-8 rounded-full bg-white object-cover flex-shrink-0" />
          )}
          <button
            title={sidebarOpen ? 'Ocultar menú' : 'Mostrar menú'}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-emerald-100 hover:bg-white/10 hover:text-white"
          >
            {sidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
          </button>
        </div>

        {sidebarItems.map((item, i) => (
          <button
            key={i}
            title={item.label}
            onClick={item.onClick}
            className={`flex items-center gap-3 h-10 rounded-xl transition-colors ${sidebarOpen ? 'px-3 justify-start' : 'w-10 justify-center'} ${
              item.active
                ? 'bg-white/20 text-white'
                : 'text-emerald-100 hover:bg-white/10 hover:text-white'
            }`}
          >
            {item.icon}
            {sidebarOpen && <span className="text-sm whitespace-nowrap">{item.label}</span>}
          </button>
        ))}
      </aside>

      <main className="flex-1 flex flex-col">
        {inWizard && (
          <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 px-8 py-3">
            <div className="flex items-center gap-2 text-sm">
              {STEPS.map((s, i) => (
                <span key={i} className="flex items-center gap-2">
                  <button
                    onClick={() => i < step ? setStep(i) : undefined}
                    className={`flex items-center gap-1.5 transition-colors ${
                      i === step
                        ? 'text-emerald-600 font-semibold'
                        : i < step
                        ? 'text-emerald-400 hover:text-emerald-600 cursor-pointer'
                        : 'text-gray-300 cursor-default'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                      i === step ? 'bg-emerald-500 text-white' :
                      i < step   ? 'bg-emerald-200 text-emerald-600' :
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
          {view === 'home' && (
            <HomePanel
              userEmail={session.user.email}
              onNewPatient={() => { startFresh(); setView('wizard'); }}
              onCreateRecipe={() => { setView('recipes'); setRecipeStarted(false); }}
              onPatients={() => setView('patients')}
              onCalendar={() => setView('calendar')}
            />
          )}
          {view === 'patients' && <PatientsPanel />}
          {view === 'calendar' && <CalendarPanel userId={session.user.id} />}
          {view === 'my-recipes' && <MyRecipesPanel />}
          {view === 'recipes' && !recipeStarted && (
            <RecipesPanel onStart={() => { startFresh(); setRecipeStarted(true); }} />
          )}
          {view === 'placeholder' && placeholder && (
            <ComingSoonPanel icon={placeholder.icon} title={placeholder.title} description={placeholder.description} />
          )}

          {inWizard && step === 0 && (
            <PatientForm
              patient={patient}
              onChange={setPatient}
              onNext={() => setStep(1)}
            />
          )}
          {inWizard && step === 1 && (
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
          {inWizard && step === 2 && (
            <MacroDistributionStep
              get={get}
              pesoActual={patient.pesoActual}
              macros={macros}
              onChange={setMacros}
              onNext={() => setStep(3)}
              onBack={() => setStep(1)}
            />
          )}
          {inWizard && step === 3 && (
            <FoodEquivalents
              get={get}
              macros={macros}
              grupos={grupos}
              onChange={setGrupos}
              onNext={() => setStep(4)}
              onBack={() => setStep(2)}
            />
          )}
          {inWizard && step === 4 && (
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
