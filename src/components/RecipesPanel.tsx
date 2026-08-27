import { ChefHat, Plus } from 'lucide-react';

interface Props {
  onStart: () => void;
}

export default function RecipesPanel({ onStart }: Props) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm p-10 flex flex-col items-center text-center gap-3">
        <ChefHat size={32} className="text-emerald-500" />
        <h2 className="text-xl font-semibold text-gray-700">Crear receta</h2>
        <p className="text-sm text-gray-400 max-w-sm">
          Arma una nueva dieta para un paciente: datos, calorías, macros, equivalentes y comidas.
        </p>
        <button
          onClick={onStart}
          className="mt-2 flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors"
        >
          <Plus size={16} /> Crear
        </button>
      </div>
    </div>
  );
}
