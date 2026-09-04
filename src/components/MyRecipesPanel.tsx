import { useEffect, useState } from 'react';
import { BookOpen, CalendarDays, ChefHat, Loader2, Search, Sparkles } from 'lucide-react';
import { fetchAllDiets, type SavedDietWithPatient } from '../lib/patients';
import DietDetailRow from './DietDetailRow';

export default function MyRecipesPanel() {
  const [diets, setDiets] = useState<SavedDietWithPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetchAllDiets()
      .then(setDiets)
      .catch(err => setError(err.message ?? 'No se pudieron cargar las recetas'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center gap-2 text-gray-400 py-16">
        <Loader2 size={18} className="animate-spin" /> Cargando recetas...
      </div>
    );
  }

  if (error) {
    return <div className="max-w-4xl mx-auto text-red-500 text-sm bg-red-50 border border-red-100 rounded-xl p-4">{error}</div>;
  }

  const filtered = query.trim()
    ? diets.filter(d => d.patient_name.toLowerCase().includes(query.trim().toLowerCase()))
    : diets;

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-[#fffdf8] shadow-[0_20px_60px_-30px_rgba(16,87,62,0.35)]">
        <div className="absolute -right-24 -top-28 h-72 w-72 rounded-full bg-emerald-200/35 blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-amber-200/30 blur-3xl" />
        <div className="relative border-b border-emerald-100/80 bg-gradient-to-r from-emerald-50/80 via-white to-amber-50/70 px-6 py-7 sm:px-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.28em] text-emerald-700">
                <Sparkles size={13} /> Tu biblioteca clínica
              </p>
              <h2 className="mt-2 flex items-center gap-2 font-serif text-3xl font-semibold tracking-tight text-slate-800">
                <BookOpen className="text-emerald-600" size={26} strokeWidth={1.8} /> Mis recetas
              </h2>
              <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">Todas las dietas que has creado, listas para consultar y volver a usar con tus pacientes.</p>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-white bg-white/80 px-4 py-3 shadow-sm">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-100 text-emerald-700"><ChefHat size={18} /></span>
              <span><strong className="block text-lg leading-none text-slate-800">{diets.length}</strong><small className="text-[11px] text-slate-500">recetas guardadas</small></span>
            </div>
          </div>

          {diets.length > 0 && (
            <div className="relative mt-6 max-w-2xl">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Buscar por nombre de paciente..."
                className="w-full rounded-xl border border-emerald-100 bg-white/90 py-3 pl-9 pr-3 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          )}
        </div>

        <div className="relative p-6 sm:p-8">
          {diets.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <span className="grid h-16 w-16 place-items-center rounded-2xl bg-emerald-50 text-emerald-500"><BookOpen size={28} /></span>
              <p className="mt-4 text-sm font-medium text-slate-700">Tu biblioteca todavía está vacía</p>
              <p className="mt-1 max-w-sm text-sm leading-6 text-slate-400">Crea y guarda una receta para verla aquí junto con sus ingredientes y distribución nutricional.</p>
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-400">No se encontró ninguna receta de “{query}”.</p>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="mb-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                <CalendarDays size={14} className="text-emerald-500" /> Recetas recientes
              </div>
              {filtered.map(diet => (
                <DietDetailRow
                  key={diet.id}
                  diet={diet}
                  headerExtra={<span className="font-semibold text-slate-800">{diet.patient_name}</span>}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
