import { useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { fetchDietMeals, METODO_LABEL, type SavedDiet } from '../lib/patients';
import type { Meal } from '../types';

interface Props {
  diet: SavedDiet;
  headerExtra?: ReactNode;
}

export default function DietDetailRow({ diet, headerExtra }: Props) {
  const [open, setOpen] = useState(false);
  const [meals, setMeals] = useState<Meal[] | null>(null);
  const [loadingMeals, setLoadingMeals] = useState(false);

  const toggle = () => {
    setOpen(!open);
    if (!open && meals === null) {
      setLoadingMeals(true);
      fetchDietMeals(diet.id).then(setMeals).finally(() => setLoadingMeals(false));
    }
  };

  const grHC   = Math.round((diet.calories * diet.carbs_pct / 100) / 4);
  const grProt = Math.round((diet.calories * diet.protein_pct / 100) / 4);
  const grLip  = Math.round((diet.calories * diet.fat_pct / 100) / 9);

  return (
    <div className="border border-gray-100 rounded-lg px-3 py-2">
      <button onClick={toggle} className="w-full flex items-center justify-between text-left">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          {open ? <ChevronDown size={13} className="text-gray-400" /> : <ChevronRight size={13} className="text-gray-400" />}
          {headerExtra}
          {diet.calories} kcal · {METODO_LABEL[diet.calculation_method] ?? diet.calculation_method}
        </div>
        <span className="text-xs text-gray-400">
          {new Date(diet.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })}
        </span>
      </button>

      {open && (
        <div className="mt-2 ml-5 flex flex-col gap-3">
          <div className="flex gap-2 text-xs">
            <span className="px-2 py-1 rounded bg-blue-50 text-blue-600">HC {diet.carbs_pct}% · {grHC} g</span>
            <span className="px-2 py-1 rounded bg-green-50 text-green-600">Prot {diet.protein_pct}% · {grProt} g</span>
            <span className="px-2 py-1 rounded bg-orange-50 text-orange-600">Lip {diet.fat_pct}% · {grLip} g</span>
          </div>

          {loadingMeals && <span className="text-xs text-gray-400 flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Cargando...</span>}
          {meals?.map(meal => (
            <div key={meal.id} className="text-xs text-gray-500">
              <span className="font-medium text-gray-600">{meal.nombre}</span>
              {meal.preparaciones.length === 0 && <span className="text-gray-300"> — sin preparaciones</span>}
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
