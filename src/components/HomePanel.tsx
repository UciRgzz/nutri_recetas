import { useEffect, useState } from 'react';
import {
  ArrowRight, CalendarDays, ChefHat, Clock3, FileText,
  Search, TrendingUp, UserPlus, Users, Utensils,
} from 'lucide-react';
import { fetchAllDiets, fetchPatients, type SavedDietWithPatient, type SavedPatient } from '../lib/patients';

interface HomePanelProps {
  userEmail?: string;
  onNewPatient: () => void;
  onCreateRecipe: () => void;
  onPatients: () => void;
  onCalendar: () => void;
}

const ACTIONS = [
  { label: 'Nuevo paciente', icon: UserPlus, tone: 'bg-emerald-50 text-emerald-600', key: 'patient' },
  { label: 'Crear receta', icon: ChefHat, tone: 'bg-rose-50 text-rose-600', key: 'recipe' },
  { label: 'Agendar cita', icon: CalendarDays, tone: 'bg-violet-50 text-violet-600', key: 'calendar' },
  { label: 'Buscar paciente', icon: Search, tone: 'bg-amber-50 text-amber-600', key: 'patients' },
];

export default function HomePanel({ userEmail, onNewPatient, onCreateRecipe, onPatients, onCalendar }: HomePanelProps) {
  const [patients, setPatients] = useState<SavedPatient[]>([]);
  const [diets, setDiets] = useState<SavedDietWithPatient[]>([]);

  useEffect(() => {
    void Promise.all([fetchPatients(), fetchAllDiets()]).then(([patientRows, dietRows]) => {
      setPatients(patientRows);
      setDiets(dietRows);
    }).catch(() => {});
  }, []);

  const firstName = userEmail?.split('@')[0] || 'colega';
  const recentPatients = patients.slice(0, 4);
  const action = (key: string) => {
    if (key === 'patient') onNewPatient();
    if (key === 'recipe') onCreateRecipe();
    if (key === 'calendar') onCalendar();
    if (key === 'patients') onPatients();
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-100 via-white to-amber-50 px-7 py-7 shadow-sm">
        <div className="relative z-10 max-w-xl">
          <p className="text-sm font-medium text-slate-700">Buenos días, {firstName} <span aria-hidden="true">☀️</span></p>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-slate-900">Comienza el día con<br />buenos hábitos</h1>
          <div className="mt-4 h-1 w-12 rounded-full bg-emerald-500" />
          <p className="mt-4 max-w-sm text-sm leading-6 text-slate-600">Organiza, planifica y transforma la salud de tus pacientes.</p>
        </div>
        <div className="absolute -right-6 -top-12 h-64 w-64 rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="absolute bottom-0 right-12 text-7xl opacity-40" aria-hidden="true">🥗</div>
        <div className="absolute bottom-5 right-40 text-4xl opacity-50" aria-hidden="true">🍎</div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800">Acciones rápidas</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {ACTIONS.map(({ label, icon: Icon, tone, key }) => (
            <button key={key} type="button" onClick={() => action(key)} className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl bg-white p-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <span className={`grid h-10 w-10 place-items-center rounded-full ${tone}`}><Icon size={19} /></span>
              <span className="text-xs font-semibold text-slate-700">{label}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_310px]">
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">Estado general de tu consultorio</h2>
            <TrendingUp size={18} className="text-emerald-500" />
          </div>
          <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 md:grid-cols-4 md:divide-y-0">
            <Metric icon={Users} label="Pacientes activos" value={patients.length} tone="emerald" />
            <Metric icon={FileText} label="Recetas creadas" value={diets.length} tone="rose" />
            <Metric icon={Utensils} label="Planes guardados" value={diets.length} tone="violet" />
            <Metric icon={CalendarDays} label="Próximas citas" value="--" tone="amber" />
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">Actividad reciente</h2>
            <button type="button" onClick={onPatients} className="text-xs font-medium text-emerald-600 hover:text-emerald-800">Ver todo</button>
          </div>
          {recentPatients.length === 0 ? (
            <div className="py-6 text-center text-sm text-slate-400">Aún no hay pacientes registrados.</div>
          ) : (
            <div className="space-y-3">
              {recentPatients.map(patient => (
                <button key={patient.id} type="button" onClick={onPatients} className="flex w-full items-center gap-3 text-left">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600"><UserPlus size={15} /></span>
                  <span className="min-w-0 flex-1 truncate text-xs text-slate-600">Nuevo paciente registrado: <b className="text-slate-800">{patient.name}</b></span>
                  <span className="shrink-0 text-[10px] text-slate-400"><Clock3 size={11} /></span>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="rounded-2xl bg-gradient-to-r from-slate-900 to-emerald-900 p-6 text-white shadow-sm">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">Tu consultorio</p>
            <h2 className="mt-2 text-xl font-semibold">Cada plan puede cambiar una vida.</h2>
            <p className="mt-1 text-sm text-slate-300">Continúa creando una experiencia de nutrición más clara y humana.</p>
          </div>
          <button type="button" onClick={onCreateRecipe} className="flex items-center gap-2 rounded-lg bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300">
            Crear receta <ArrowRight size={16} />
          </button>
        </div>
      </section>
    </div>
  );
}

function Metric({ icon: Icon, label, value, tone }: { icon: typeof Users; label: string; value: number | string; tone: 'emerald' | 'rose' | 'violet' | 'amber' }) {
  const tones = {
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600',
    violet: 'bg-violet-50 text-violet-600',
    amber: 'bg-amber-50 text-amber-600',
  };
  return (
    <div className="flex flex-col items-center gap-2 px-3 py-2 text-center">
      <span className={`grid h-9 w-9 place-items-center rounded-full ${tones[tone]}`}><Icon size={16} /></span>
      <span className="text-2xl font-bold text-slate-800">{value}</span>
      <span className="text-[11px] leading-4 text-slate-500">{label}</span>
    </div>
  );
}
