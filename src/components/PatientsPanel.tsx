import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Loader2, Users } from 'lucide-react';
import { fetchPatients, fetchDietsForPatient, fetchDietMeals, type SavedPatient, type SavedDiet } from '../lib/patients';
import type { Meal } from '../types';

const METODO_LABEL: Record<string, string> = {
  'harris-benedict':  'Harris-Benedict',
  'fao-oms-onu':      'FAO/OMS/ONU',
  'valencia':         'Valencia',
  'mifflin-st-jeor':  'Mifflin-St Jeor',
  'gramos-por-kilo':  'g/kg de peso',
  'calorias-por-kilo':'kcal/kg de peso',
};

export default function PatientsPanel() {
  const [patients, setPatients] = useState<SavedPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedPatient, setExpandedPatient] = useState<string | null>(null);

  useEffect(() => {
    fetchPatients()
      .then(setPatients)
      .catch(err => setError(err.message ?? 'No se pudieron cargar los pacientes'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center gap-2 text-gray-400 py-16">
        <Loader2 size={18} className="animate-spin" /> Cargando pacientes...
      </div>
    );
  }

  if (error) {
    return <div className="max-w-4xl mx-auto text-red-500 text-sm bg-red-50 border border-red-100 rounded-xl p-4">{error}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-1 flex items-center gap-2">
          <Users size={20} className="text-sky-500" /> Pacientes atendidos
        </h2>
        <p className="text-sm text-gray-400 mb-6">Historial de pacientes y dietas guardadas</p>

        {patients.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">
            Aún no hay pacientes guardados. Al terminar una dieta, usa "Guardar paciente" para que aparezca aquí.
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-gray-100">
            {patients.map(patient => (
              <PatientRow
                key={patient.id}
                patient={patient}
                expanded={expandedPatient === patient.id}
                onToggle={() => setExpandedPatient(expandedPatient === patient.id ? null : patient.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PatientRow({ patient, expanded, onToggle }: { patient: SavedPatient; expanded: boolean; onToggle: () => void }) {
  const [diets, setDiets] = useState<SavedDiet[] | null>(null);
  const loadingDiets = expanded && diets === null;

  useEffect(() => {
    if (!expanded || diets !== null) return;
    let cancelled = false;
    fetchDietsForPatient(patient.id).then(result => {
      if (!cancelled) setDiets(result);
    });
    return () => { cancelled = true; };
  }, [expanded, diets, patient.id]);

  return (
    <div className="py-3">
      <button onClick={onToggle} className="w-full flex items-center justify-between text-left">
        <div className="flex items-center gap-2">
          {expanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
          <span className="font-medium text-gray-700">{patient.name}</span>
          <span className="text-xs text-gray-400">
            {patient.age} años · {patient.sex === 'F' ? 'Femenino' : 'Masculino'} · {patient.current_weight} kg
          </span>
        </div>
        <span className="text-xs text-gray-400">
          {new Date(patient.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })}
        </span>
      </button>

      {expanded && (
        <div className="mt-3 ml-6 flex flex-col gap-2">
          {loadingDiets && <span className="text-xs text-gray-400 flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Cargando dietas...</span>}
          {diets && diets.length === 0 && <span className="text-xs text-gray-400">Sin dietas guardadas para este paciente.</span>}
          {diets?.map(diet => <DietRow key={diet.id} diet={diet} />)}
        </div>
      )}
    </div>
  );
}

function DietRow({ diet }: { diet: SavedDiet }) {
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

  return (
    <div className="border border-gray-100 rounded-lg px-3 py-2">
      <button onClick={toggle} className="w-full flex items-center justify-between text-left">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          {open ? <ChevronDown size={13} className="text-gray-400" /> : <ChevronRight size={13} className="text-gray-400" />}
          {diet.calories} kcal · {METODO_LABEL[diet.calculation_method] ?? diet.calculation_method}
        </div>
        <span className="text-xs text-gray-400">
          {new Date(diet.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })}
        </span>
      </button>

      {open && (
        <div className="mt-2 ml-5 flex flex-col gap-2">
          {loadingMeals && <span className="text-xs text-gray-400 flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Cargando...</span>}
          {meals?.map(meal => (
            <div key={meal.id} className="text-xs text-gray-500">
              <span className="font-medium text-gray-600">{meal.nombre}</span>
              {meal.preparaciones.length === 0 && <span className="text-gray-300"> — sin preparaciones</span>}
              {meal.preparaciones.map(prep => (
                <div key={prep.id} className="ml-3">
                  {prep.nombre}: {prep.ingredientes.map(i => i.nombre).filter(Boolean).join(', ') || '—'}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
