import { ChefHat } from 'lucide-react';

export default function RecipesPanel() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm p-10 flex flex-col items-center text-center gap-3">
        <ChefHat size={32} className="text-sky-500" />
        <h2 className="text-xl font-semibold text-gray-700">Crear receta</h2>
        <p className="text-sm text-gray-400 max-w-sm">Próximamente. Esta sección se implementará más adelante.</p>
      </div>
    </div>
  );
}
