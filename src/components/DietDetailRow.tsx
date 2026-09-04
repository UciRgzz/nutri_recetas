import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { fetchDietMeals, METODO_LABEL, type SavedDiet } from '../lib/patients';
import type { Meal } from '../types';

interface Props {
  diet: SavedDiet;
  headerExtra?: ReactNode;
  defaultOpen?: boolean;
}

export default function DietDetailRow({ diet, headerExtra, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [meals, setMeals] = useState<Meal[] | null>(null);
  const [loadingMeals, setLoadingMeals] = useState(false);

  const toggle = () => {
    setOpen(!open);
    if (!open && meals === null) {
      setLoadingMeals(true);
      fetchDietMeals(diet.id).then(setMeals).finally(() => setLoadingMeals(false));
    }
  };

  useEffect(() => {
    if (defaultOpen && meals === null) {
      let cancelled = false;
      const loadMeals = async () => {
        setLoadingMeals(true);
        try {
          const fetchedMeals = await fetchDietMeals(diet.id);
          if (!cancelled) setMeals(fetchedMeals);
        } finally {
          if (!cancelled) setLoadingMeals(false);
        }
      };
      void loadMeals();
      return () => { cancelled = true; };
    }
    return undefined;
  }, [defaultOpen, diet.id, meals]);

  const grHC   = Math.round((diet.calories * diet.carbs_pct / 100) / 4);
  const grProt = Math.round((diet.calories * diet.protein_pct / 100) / 4);
  const grLip  = Math.round((diet.calories * diet.fat_pct / 100) / 9);

  return (
    <div className={`overflow-hidden rounded-2xl border bg-white transition-shadow ${open ? 'border-emerald-200 shadow-md shadow-emerald-900/5' : 'border-slate-100 shadow-sm hover:border-emerald-100 hover:shadow-md'}`}>
      <button onClick={toggle} className="group flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left sm:px-5">
        <div className="flex min-w-0 items-center gap-3 text-sm text-slate-600">
          <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl transition-colors ${open ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-50 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600'}`}>
            {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          </span>
          {headerExtra}
          <span className="truncate text-slate-400">· {diet.calories} kcal</span>
          <span className="hidden rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700 sm:inline">{METODO_LABEL[diet.calculation_method] ?? diet.calculation_method}</span>
        </div>
        <span className="shrink-0 text-xs text-slate-400">
          {new Date(diet.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })}
        </span>
      </button>

      {open && (
        <div className="border-t border-emerald-50 bg-gradient-to-b from-emerald-50/35 to-white px-4 py-4 sm:px-5">
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-lg bg-blue-50 px-3 py-1.5 font-medium text-blue-700">HC {diet.carbs_pct}% · {grHC} g</span>
            <span className="rounded-lg bg-green-50 px-3 py-1.5 font-medium text-green-700">Prot {diet.protein_pct}% · {grProt} g</span>
            <span className="rounded-lg bg-orange-50 px-3 py-1.5 font-medium text-orange-700">Lip {diet.fat_pct}% · {grLip} g</span>
          </div>

          {loadingMeals && <span className="mt-3 flex items-center gap-1 text-xs text-slate-400"><Loader2 size={12} className="animate-spin" /> Cargando detalle...</span>}
          {meals?.map(meal => (
            <div key={meal.id} className="mt-4 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">{meal.nombre}</span>
              {meal.preparaciones.length === 0 && <span className="text-slate-300"> — sin preparaciones</span>}
              {meal.preparaciones.map(prep => (
                <div key={prep.id} className="ml-3 mt-1">
                  <div className="text-gray-600">{prep.nombre}</div>
                  <table className="w-full text-xs mt-0.5">
                    <tbody>
                      {prep.ingredientes.map(ing => (
                        <tr key={ing.id} className="text-gray-400">
                          <td className="py-0.5 pr-2 text-gray-500">{ing.nombre}</td>
                          <td className="py-0.5 pr-2 text-center">{ing.gramos} g</td>
                          <td className="py-0.5 pr-2 text-center">{ing.equivalente} eq.</td>
                          <td className="py-0.5 text-center">{ing.unidad}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
