import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Loader2, Users, Pencil, Check, X, Search, CalendarDays } from 'lucide-react';
import { fetchPatients, fetchDietsForPatient, fetchDietMeals, updatePatient, type SavedPatient, type SavedDiet } from '../lib/patients';
import { calcularIMC, clasificarIMC } from '../utils/calculations';
import { abrirPlantillaSemanal } from '../utils/plantillaSemanal';
import type { Patient } from '../types';
import logoSrc from '../assets/logo.png';
import DietDetailRow from './DietDetailRow';

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
  const [query, setQuery] = useState('');

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

  const filtered = query.trim()
    ? patients.filter(p => p.name.toLowerCase().includes(query.trim().toLowerCase()))
    : patients;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-1 flex items-center gap-2">
          <Users size={20} className="text-emerald-500" /> Mis pacientes
        </h2>
        <p className="text-sm text-gray-400 mb-4">Historial de pacientes y dietas guardadas. Haz clic en un paciente para ver el detalle o editarlo.</p>

        {patients.length > 0 && (
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar paciente por nombre..."
              className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
            />
          </div>
        )}

        {patients.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">
            Aún no hay pacientes guardados. Al terminar una dieta, usa "Guardar paciente" para que aparezca aquí.
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">
            No se encontró ningún paciente con "{query}".
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-gray-100">
            {filtered.map(patient => (
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

  const exportWeeklyMenu = async () => {
    if (!diets || diets.length === 0) return;
    const latestDiet = diets[0];
    try {
      const meals = await fetchDietMeals(latestDiet.id);
      await abrirPlantillaSemanal(
        logoSrc,
        latestDiet.calories,
        toPatient(patient),
        {
          hdec: latestDiet.carbs_pct,
          prot: latestDiet.protein_pct,
          lip: latestDiet.fat_pct,
        },
        meals
      );
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'No se pudo abrir la plantilla semanal');
    }
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
        <button onClick={startEdit} title="Editar paciente" className="text-gray-400 hover:text-emerald-600 p-1">
          <Pencil size={14} />
        </button>
        {diets && diets.length > 0 && (
          <button
            onClick={() => { void exportWeeklyMenu(); }}
            title="Plantilla semanal"
            className="text-gray-400 hover:text-emerald-600 p-1"
          >
            <CalendarDays size={14} />
          </button>
        )}
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
          {diets?.map(diet => <DietDetailRow key={diet.id} diet={diet} />)}
        </div>
      )}
    </div>
  );
}
