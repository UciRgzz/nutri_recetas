import { useState, useEffect } from 'react';
import type { Patient, MetodoCalculo } from '../types';
import { activityLevels, calcularGET } from '../utils/calculations';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  patient: Patient;
  metodo: MetodoCalculo;
  actividadFisica: number;
  factorActividad: number;
  get: number;
  onMetodo: (m: MetodoCalculo) => void;
  onActividad: (v: number) => void;
  onFactor: (v: number) => void;
  onGet: (v: number) => void;
  onNext: () => void;
  onBack: () => void;
}

const metodos: { value: MetodoCalculo; label: string }[] = [
  { value: 'harris-benedict',  label: 'Harris-Benedict' },
  { value: 'fao-oms-onu',      label: 'FAO/OMS/ONU' },
  { value: 'valencia',         label: 'Valencia' },
  { value: 'mifflin-st-jeor',  label: 'Mifflin-St. Jeor' },
  { value: 'gramos-por-kilo',  label: 'Gramos por kilo' },
  { value: 'calorias-por-kilo',label: 'Calorías por kilo' },
];

export default function CalorieCalculator({
  patient, metodo, actividadFisica, factorActividad, get,
  onMetodo, onActividad, onFactor, onGet, onNext, onBack,
}: Props) {
  const [showFactor, setShowFactor] = useState(false);
  const [gramosKilo, setGramosKilo] = useState(0);
  const [caloriasKilo, setCaloriasKilo] = useState(0);

  const recalcular = (m: MetodoCalculo, fa: number, gk: number, ck: number) => {
    const result = calcularGET(patient, m, fa, gk, ck);
    onGet(result);
  };

  // Calculate GET immediately on mount with current defaults
  useEffect(() => {
    recalcular(metodo, factorActividad, gramosKilo, caloriasKilo);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMetodo = (m: MetodoCalculo) => {
    onMetodo(m);
    recalcular(m, factorActividad, gramosKilo, caloriasKilo);
  };

  const handleActividad = (v: number) => {
    onActividad(v);
    const fa = activityLevels.find(a => a.value === v)?.factor || 1;
    onFactor(fa);
    recalcular(metodo, fa, gramosKilo, caloriasKilo);
  };

  const handleFactor = (fa: number) => {
    onFactor(fa);
    recalcular(metodo, fa, gramosKilo, caloriasKilo);
  };

  const needsKilo = metodo === 'gramos-por-kilo' || metodo === 'calorias-por-kilo';

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm p-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-6 text-center">
          Método de cálculo de calorías
        </h2>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">Método</label>
            <select
              value={metodo}
              onChange={e => handleMetodo(e.target.value as MetodoCalculo)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {metodos.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {needsKilo && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-600">
                {metodo === 'gramos-por-kilo' ? 'Gramos por kg' : 'Calorías por kg'}
              </label>
              <input
                type="number"
                min={0}
                step={0.1}
                value={metodo === 'gramos-por-kilo' ? gramosKilo : caloriasKilo}
                onChange={e => {
                  const v = parseFloat(e.target.value) || 0;
                  if (metodo === 'gramos-por-kilo') {
                    setGramosKilo(v);
                    recalcular(metodo, factorActividad, v, caloriasKilo);
                  } else {
                    setCaloriasKilo(v);
                    recalcular(metodo, factorActividad, gramosKilo, v);
                  }
                }}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          )}

          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-blue-500 min-w-max">
              Porcentaje de actividad física
            </label>
            <select
              value={actividadFisica}
              onChange={e => handleActividad(parseInt(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 flex-1"
            >
              {activityLevels.map(a => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowFactor(!showFactor)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 w-fit"
          >
            {showFactor ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            Factor de actividad
          </button>

          {showFactor && (
            <div className="flex flex-col gap-1 pl-4">
              <label className="text-sm font-medium text-gray-600">
                Factor ({factorActividad.toFixed(3)})
              </label>
              <input
                type="number"
                step={0.001}
                min={1}
                max={2.5}
                value={factorActividad}
                onChange={e => handleFactor(parseFloat(e.target.value) || 1)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-32"
              />
            </div>
          )}

          <div className="p-4 bg-green-50 rounded-xl text-center">
            <p className="text-xs text-gray-500">Gasto Energético Total (GET)</p>
            <p className="text-3xl font-bold text-green-600">
              {get > 0 ? get : '—'} <span className="text-lg font-normal text-gray-500">{get > 0 ? 'kcal/día' : ''}</span>
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onBack} className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors">
            ← Atrás
          </button>
          <button
            onClick={onNext}
            disabled={get <= 0}
            className="flex-1 py-3 rounded-xl font-medium text-white bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:text-gray-500 transition-colors"
          >
            Continuar →
          </button>
        </div>
      </div>
    </div>
  );
}
