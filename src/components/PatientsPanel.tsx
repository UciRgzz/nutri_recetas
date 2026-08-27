import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Loader2, Users, Pencil, Check, X } from 'lucide-react';
import { fetchPatients, fetchDietsForPatient, fetchDietMeals, updatePatient, type SavedPatient, type SavedDiet } from '../lib/patients';
import { calcularIMC, clasificarIMC } from '../utils/calculations';
import type { Meal, Patient } from '../types';

const METODO_LABEL: Record<string, string> = {
  'harris-benedict':  'Harris-Benedict',
  'fao-oms-onu':      'FAO/OMS/ONU',
  'valencia':         'Valencia',
  'mifflin-st-jeor':  'Mifflin-St Jeor',
  'gramos-por-kilo':  'g/kg de peso',
  'calorias-por-kilo':'kcal/kg de peso',
};

function toPatient(p: SavedPatient): Patient {
  return {
    nombre: p.name,
    edad: p.age,
    sexo: p.sex,
    pesoActual: p.current_weight,
    pesoIdeal: p.ideal_weight ?? 0,
    talla: p.height_cm,
  };
}

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

  const handleUpdated = (updated: SavedPatient) => {
    setPatients(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

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
          <Users size={20} className="text-sky-500" /> Mis pacientes
        </h2>
        <p className="text-sm text-gray-400 mb-6">Historial de pacientes y dietas guardadas. Haz clic en un paciente para ver el detalle o editarlo.</p>

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
                onUpdated={handleUpdated}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PatientRow({ patient, expanded, onToggle, onUpdated }: {
  patient: SavedPatient;
  expanded: boolean;
  onToggle: () => void;
  onUpdated: (updated: SavedPatient) => void;
}) {
  const [diets, setDiets] = useState<SavedDiet[] | null>(null);
  const loadingDiets = expanded && diets === null;
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Patient>(() => toPatient(patient));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (!expanded || diets !== null) return;
    let cancelled = false;
    fetchDietsForPatient(patient.id).then(result => {
      if (!cancelled) setDiets(result);
    });
    return () => { cancelled = true; };
  }, [expanded, diets, patient.id]);

  const startEdit = () => {
    setForm(toPatient(patient));
    setSaveError('');
    setEditing(true);
  };

  const save = async () => {
    setSaving(true);
    setSaveError('');
    try {
      await updatePatient(patient.id, form);
      onUpdated({
        ...patient,
        name: form.nombre,
        age: form.edad,
        sex: form.sexo,
        current_weight: form.pesoActual,
        ideal_weight: form.pesoIdeal || null,
        height_cm: form.talla,
      });
      setEditing(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  const imc = patient.current_weight > 0 && patient.height_cm > 0
    ? calcularIMC(patient.current_weight, patient.height_cm)
    : null;

  if (editing) {
    return (
      <div className="py-3">
        <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-xl p-4">
          <label className="col-span-2 flex flex-col gap-1 text-xs text-gray-500">
            Nombre completo
            <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-xs text-gray-500">
            Edad
            <input type="number" value={form.edad || ''} onChange={e => setForm({ ...form, edad: parseFloat(e.target.value) || 0 })} className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-xs text-gray-500">
            Sexo
            <select value={form.sexo} onChange={e => setForm({ ...form, sexo: e.target.value as 'M' | 'F' })} className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm">
              <option value="F">Femenino</option>
              <option value="M">Masculino</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-gray-500">
            Peso actual (kg)
            <input type="number" step={0.1} value={form.pesoActual || ''} onChange={e => setForm({ ...form, pesoActual: parseFloat(e.target.value) || 0 })} className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-xs text-gray-500">
            Peso ideal (kg)
            <input type="number" step={0.1} value={form.pesoIdeal || ''} onChange={e => setForm({ ...form, pesoIdeal: parseFloat(e.target.value) || 0 })} className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm" />
          </label>
          <label className="flex flex-col gap-1 text-xs text-gray-500">
            Talla (cm)
            <input type="number" step={0.1} value={form.talla || ''} onChange={e => setForm({ ...form, talla: parseFloat(e.target.value) || 0 })} className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm" />
          </label>

          {saveError && <p className="col-span-2 text-xs text-red-500">{saveError}</p>}

          <div className="col-span-2 flex justify-end gap-2 mt-1">
            <button onClick={() => setEditing(false)} className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700">
              <X size={13} /> Cancelar
            </button>
            <button onClick={save} disabled={saving} className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs hover:bg-emerald-600 disabled:opacity-50">
              <Check size={13} /> {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-3">
      <div className="w-full flex items-center justify-between text-left gap-2">
        <button onClick={onToggle} className="flex-1 flex items-center gap-2 text-left">
          {expanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
          <span className="font-medium text-gray-700">{patient.name}</span>
          <span className="text-xs text-gray-400">
            {patient.age} años · {patient.sex === 'F' ? 'Femenino' : 'Masculino'} · {patient.current_weight} kg
          </span>
        </button>
        <button onClick={startEdit} title="Editar paciente" className="text-gray-400 hover:text-sky-600 p-1">
          <Pencil size={14} />
        </button>
        <span className="text-xs text-gray-400">
          {new Date(patient.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })}
        </span>
      </div>

      {expanded && (
        <div className="mt-3 ml-6 flex flex-col gap-3">
          <div className="flex flex-wrap gap-3 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
            <span>Peso ideal: <b className="text-gray-700">{patient.ideal_weight ?? '—'} kg</b></span>
            <span>Talla: <b className="text-gray-700">{patient.height_cm} cm</b></span>
            {imc && <span>IMC: <b className="text-gray-700">{imc.toFixed(1)}</b> ({clasificarIMC(imc)})</span>}
          </div>

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

  const grHC   = Math.round((diet.calories * diet.carbs_pct / 100) / 4);
  const grProt = Math.round((diet.calories * diet.protein_pct / 100) / 4);
  const grLip  = Math.round((diet.calories * diet.fat_pct / 100) / 9);

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
