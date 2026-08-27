import { useEffect, useMemo, useState } from 'react';
import type { Patient } from '../types';
import { calcularIMC, clasificarIMC, calcularPesoIdeal } from '../utils/calculations';
import { fetchPatients, type SavedPatient } from '../lib/patients';

interface Props {
  patient: Patient;
  onChange: (p: Patient) => void;
  onNext: () => void;
}

export default function PatientForm({ patient, onChange, onNext }: Props) {
  const [knownPatients, setKnownPatients] = useState<SavedPatient[]>([]);

  useEffect(() => {
    fetchPatients().then(setKnownPatients).catch(() => {});
  }, []);

  // Nombres únicos, el más reciente primero (fetchPatients ya viene ordenado por fecha desc)
  const latestByName = useMemo(() => {
    const map = new Map<string, SavedPatient>();
    for (const p of knownPatients) {
      const key = p.name.toLowerCase();
      if (!map.has(key)) map.set(key, p);
    }
    return map;
  }, [knownPatients]);

  const imc = patient.pesoActual > 0 && patient.talla > 0
    ? calcularIMC(patient.pesoActual, patient.talla)
    : null;

  const handleNombreChange = (value: string) => {
    const match = latestByName.get(value.trim().toLowerCase());
    if (match) {
      onChange({
        nombre: match.name,
        edad: match.age,
        sexo: match.sex,
        pesoActual: match.current_weight,
        pesoIdeal: match.ideal_weight ?? 0,
        talla: match.height_cm,
      });
    } else {
      onChange({ ...patient, nombre: value });
    }
  };

  const field = (label: string, key: keyof Patient, type = 'text', extra?: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-600">{label}</label>
      <input
        type={type}
        value={(patient[key] as string | number) || ''}
        onChange={e => onChange({ ...patient, [key]: type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value })}
        {...extra}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
      />
    </div>
  );

  const valid = patient.nombre && patient.edad > 0 && patient.pesoActual > 0 && patient.talla > 0;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm p-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-6 text-center">Datos del paciente</h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">
              Nombre completo
              {knownPatients.length > 0 && (
                <span className="ml-1 text-xs text-emerald-500 font-normal">(elige un paciente atendido para autocompletar sus datos)</span>
              )}
            </label>
            <input
              list="known-patients"
              value={patient.nombre}
              onChange={e => handleNombreChange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
            />
            <datalist id="known-patients">
              {Array.from(latestByName.values()).map(p => <option key={p.id} value={p.name} />)}
            </datalist>
          </div>

          {field('Edad (años)', 'edad', 'number', { min: 1, max: 120 })}

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">Sexo</label>
            <select
              value={patient.sexo}
              onChange={e => {
                const sexo = e.target.value as 'M' | 'F';
                const pesoIdeal = patient.talla > 0 ? calcularPesoIdeal(patient.talla, sexo) : patient.pesoIdeal;
                onChange({ ...patient, sexo, pesoIdeal });
              }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <option value="F">Femenino</option>
              <option value="M">Masculino</option>
            </select>
          </div>

          {field('Peso actual (kg)', 'pesoActual', 'number', { min: 1, max: 500, step: 0.1 })}

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">
              Peso ideal (kg)
              <span className="ml-1 text-xs text-emerald-400 font-normal">(Lorentz)</span>
            </label>
            <input
              type="number"
              min={1}
              max={500}
              step={0.1}
              value={patient.pesoIdeal || ''}
              onChange={e => onChange({ ...patient, pesoIdeal: parseFloat(e.target.value) || 0 })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent bg-emerald-50"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">Talla (cm)</label>
            <input
              type="number"
              min={50}
              max={250}
              step={0.1}
              value={patient.talla || ''}
              onChange={e => {
                const talla = parseFloat(e.target.value) || 0;
                const pesoIdeal = talla > 0 ? calcularPesoIdeal(talla, patient.sexo) : patient.pesoIdeal;
                onChange({ ...patient, talla, pesoIdeal });
              }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
            />
          </div>
        </div>

        {imc && (
          <div className="mt-6 p-4 bg-emerald-50 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Índice de Masa Corporal</p>
              <p className="text-2xl font-bold text-emerald-600">{imc.toFixed(1)}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              imc < 18.5 ? 'bg-yellow-100 text-yellow-700' :
              imc < 25   ? 'bg-green-100 text-green-700' :
              imc < 30   ? 'bg-orange-100 text-orange-700' :
                           'bg-red-100 text-red-700'
            }`}>
              {clasificarIMC(imc)}
            </span>
          </div>
        )}

        <button
          onClick={onNext}
          disabled={!valid}
          className="mt-6 w-full py-3 rounded-xl font-medium text-white bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
        >
          Continuar →
        </button>
      </div>
    </div>
  );
}
