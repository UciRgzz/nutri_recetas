import { useEffect, useState } from 'react';
import { BookOpen, Loader2, Search } from 'lucide-react';
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
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-1 flex items-center gap-2">
          <BookOpen size={20} className="text-emerald-500" /> Mis recetas
        </h2>
        <p className="text-sm text-gray-400 mb-4">Todas las dietas que has creado para tus pacientes.</p>

        {diets.length > 0 && (
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar por nombre de paciente..."
              className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
            />
          </div>
        )}

        {diets.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">
            Aún no has creado ninguna receta. Usa "Crear receta" y termina el paso de "Guardar paciente" para que aparezca aquí.
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">
            No se encontró ninguna receta de "{query}".
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map(diet => (
              <DietDetailRow
                key={diet.id}
                diet={diet}
                headerExtra={<span className="font-medium text-gray-700 mr-1">{diet.patient_name} ·</span>}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
