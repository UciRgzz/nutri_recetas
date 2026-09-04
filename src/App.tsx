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
import VideosPanel from './components/VideosPanel';
import type { Patient, MetodoCalculo, MacroDistribution, FoodGroup, Meal } from './types';
import { initGrupos } from './utils/foodGroups';
import { activityLevels } from './utils/calculations';
import { AuthGate } from './components/Auth';
import { supabase } from './lib/supabase';
import logoSrc from './assets/logo.png';

const STEPS = ['Paciente', 'Calorías', 'Macros', 'Equivalentes', 'Dieta'];

type View = 'home' | 'wizard' | 'patients' | 'recipes' | 'calendar' | 'my-recipes' | 'videos' | 'placeholder';

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
  const [patientStarted, setPatientStarted] = useState(false);
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

  const inWizard = (view === 'wizard' && patientStarted) || (view === 'recipes' && recipeStarted);

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
    { icon: <UserPlus size={20} />, label: 'Nuevo paciente', active: view === 'wizard', onClick: () => { setView('wizard'); setPatientStarted(false); setStep(0); } },
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
    { icon: <PlayCircle size={20} />, label: 'Videos', active: view === 'videos', onClick: () => setView('videos') },
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
              onNewPatient={() => { startFresh(); setPatientStarted(true); setView('wizard'); }}
              onCreateRecipe={() => { setView('recipes'); setRecipeStarted(false); }}
              onPatients={() => setView('patients')}
              onCalendar={() => setView('calendar')}
            />
          )}
          {view === 'patients' && <PatientsPanel onNewPatient={() => { startFresh(); setPatientStarted(true); setView('wizard'); }} />}
          {view === 'calendar' && <CalendarPanel userId={session.user.id} />}
          {view === 'my-recipes' && <MyRecipesPanel />}
          {view === 'videos' && <VideosPanel />}
          {view === 'recipes' && !recipeStarted && (
            <RecipesPanel onStart={() => { startFresh(); setRecipeStarted(true); }} />
          )}
          {view === 'wizard' && !patientStarted && (
            <div className="mx-auto w-full max-w-5xl">
              <section className="recipe-stage relative isolate overflow-hidden rounded-[2rem] border border-white/80 bg-[#fffdf8] px-6 py-14 shadow-[0_20px_60px_-30px_rgba(16,87,62,0.35)] sm:px-12 sm:py-20">
                <div className="recipe-grid absolute inset-0 -z-10 opacity-60" />
                <div className="absolute -left-24 -top-32 -z-10 h-80 w-80 rounded-full bg-emerald-200/40 blur-3xl" />
                <div className="absolute -bottom-40 -right-24 -z-10 h-96 w-96 rounded-full bg-amber-200/45 blur-3xl" />
                <div className="relative z-10 mx-auto flex max-w-xl flex-col items-center text-center">
                  <div className="mb-6 grid h-20 w-20 place-items-center rounded-[1.75rem] bg-emerald-600 text-white shadow-lg shadow-emerald-600/25">
                    <UserPlus size={38} strokeWidth={1.7} />
                  </div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-emerald-700">Nuevo expediente</p>
                  <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight text-slate-800 sm:text-5xl">Conoce a tu paciente</h1>
                  <p className="mt-5 max-w-md text-sm leading-6 text-slate-500 sm:text-base">Registra sus datos para crear una valoración y un plan nutricional hecho a su medida.</p>
                  <button
                    type="button"
                    onClick={() => { startFresh(); setPatientStarted(true); }}
                    className="mt-8 flex items-center gap-3 rounded-full bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-700/20 transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                  >
                    <UserPlus size={17} /> Crear nuevo paciente
                  </button>
                </div>
              </section>
            </div>
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
              onFinish={() => { setView('home'); setPatientStarted(false); setRecipeStarted(false); }}
            />
          )}
        </div>
      </main>
    </div>
  );
}
