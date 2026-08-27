import type { Patient } from '../types';
import { calcularIMC, clasificarIMC, calcularPesoIdeal } from '../utils/calculations';

interface Props {
  patient: Patient;
  onChange: (p: Patient) => void;
  onNext: () => void;
}

export default function PatientForm({ patient, onChange, onNext }: Props) {
  const imc = patient.pesoActual > 0 && patient.talla > 0
    ? calcularIMC(patient.pesoActual, patient.talla)
    : null;

  const field = (label: string, key: keyof Patient, type = 'text', extra?: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-600">{label}</label>
      <input
        type={type}
        value={(patient[key] as string | number) || ''}
        onChange={e => onChange({ ...patient, [key]: type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value })}
        {...extra}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
      />
    </div>
  );

  const valid = patient.nombre && patient.edad > 0 && patient.pesoActual > 0 && patient.talla > 0;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm p-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-6 text-center">Datos del paciente</h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            {field('Nombre completo', 'nombre')}
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
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="F">Femenino</option>
              <option value="M">Masculino</option>
            </select>
          </div>

          {field('Peso actual (kg)', 'pesoActual', 'number', { min: 1, max: 500, step: 0.1 })}

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">
              Peso ideal (kg)
              <span className="ml-1 text-xs text-blue-400 font-normal">(Lorentz)</span>
            </label>
            <input
              type="number"
              min={1}
              max={500}
              step={0.1}
              value={patient.pesoIdeal || ''}
              onChange={e => onChange({ ...patient, pesoIdeal: parseFloat(e.target.value) || 0 })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-blue-50"
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
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />
          </div>
        </div>

        {imc && (
          <div className="mt-6 p-4 bg-blue-50 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Índice de Masa Corporal</p>
              <p className="text-2xl font-bold text-blue-600">{imc.toFixed(1)}</p>
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
          className="mt-6 w-full py-3 rounded-xl font-medium text-white bg-blue-500 hover:bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
        >
          Continuar →
        </button>
      </div>
    </div>
  );
}
