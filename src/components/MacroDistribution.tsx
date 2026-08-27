import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import type { MacroDistribution as MacroType } from '../types';

interface Props {
  get: number;
  pesoActual: number;
  macros: MacroType;
  onChange: (m: MacroType) => void;
  onNext: () => void;
  onBack: () => void;
}

const COLORS = { hdec: '#4ade80', prot: '#fb923c', lip: '#60a5fa' };

export default function MacroDistributionStep({ get, pesoActual, macros, onChange, onNext, onBack }: Props) {
  const totalPct = macros.hdec + macros.prot + macros.lip;

  const grHdec = Math.round((get * macros.hdec / 100) / 4);
  const grProt = Math.round((get * macros.prot / 100) / 4);
  const grLip  = Math.round((get * macros.lip  / 100) / 9);

  const calHdec = Math.round(grHdec * 4);
  const calProt = Math.round(grProt * 4);
  const calLip  = Math.round(grLip  * 9);
  const calTotal = calHdec + calProt + calLip;

  const calPerKg = pesoActual > 0 ? (calTotal / pesoActual).toFixed(2) : '0';

  const pieData = [
    { name: 'Hdec', value: macros.hdec, color: COLORS.hdec },
    { name: 'Prot', value: macros.prot, color: COLORS.prot },
    { name: 'Lip',  value: macros.lip,  color: COLORS.lip  },
  ];

  const setMacro = (key: keyof MacroType, val: number) => {
    const clamped = Math.max(0, Math.min(100, val));
    onChange({ ...macros, [key]: clamped });
  };

  const Row = ({
    label, color, gr, cal, pct, grKg, macroKey,
  }: {
    label: string; color: string; gr: number; cal: number; pct: number; grKg: number; macroKey: keyof MacroType;
  }) => (
    <tr className="border-b border-gray-100">
      <td className="py-3 pr-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
          <span className="font-medium text-gray-700">{label}</span>
        </div>
      </td>
      <td className="py-3 text-center text-gray-700">{gr} g</td>
      <td className="py-3 text-center text-gray-700">{cal} cal</td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0} max={100} value={pct}
            onChange={e => setMacro(macroKey, parseInt(e.target.value))}
            className="flex-1 h-1 accent-red-400"
            style={{ accentColor: '#ef4444' }}
          />
          <input
            type="number"
            value={pct}
            min={0} max={100}
            onChange={e => setMacro(macroKey, parseInt(e.target.value) || 0)}
            className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
      </td>
      <td className="py-3 text-center text-gray-500 text-sm">{grKg.toFixed(1)} g</td>
    </tr>
  );

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm p-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-6 text-center">
          Distribución de macronutrimentos
        </h2>

        {totalPct !== 100 && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700 text-center">
            La suma de porcentajes es {totalPct}% — debe ser 100%
          </div>
        )}

        <div className="flex gap-8 items-center">
          <div className="w-48 h-48 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={80} strokeWidth={2}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `${v}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-2 text-left text-gray-500 font-medium"></th>
                  <th className="py-2 text-center text-gray-500 font-medium">Gramos</th>
                  <th className="py-2 text-center text-gray-500 font-medium">Calorías</th>
                  <th className="py-2 text-center text-gray-500 font-medium">Distribución</th>
                  <th className="py-2 text-center text-gray-500 font-medium">gr*kilo</th>
                </tr>
              </thead>
              <tbody>
                <Row label="Hdec" color={COLORS.hdec} gr={grHdec} cal={calHdec} pct={macros.hdec} grKg={pesoActual > 0 ? grHdec / pesoActual : 0} macroKey="hdec" />
                <Row label="Prot" color={COLORS.prot} gr={grProt} cal={calProt} pct={macros.prot} grKg={pesoActual > 0 ? grProt / pesoActual : 0} macroKey="prot" />
                <Row label="Lip"  color={COLORS.lip}  gr={grLip}  cal={calLip}  pct={macros.lip}  grKg={pesoActual > 0 ? grLip  / pesoActual : 0} macroKey="lip"  />
                <tr className="border-t border-gray-200">
                  <td colSpan={2} className="py-3 text-gray-500">Total</td>
                  <td className="py-3 text-center font-bold text-blue-500">{calTotal} cal</td>
                  <td colSpan={2} />
                </tr>
                <tr>
                  <td colSpan={2} className="py-2 text-gray-500">Calorías por kilo</td>
                  <td className="py-2 text-center font-bold text-blue-500">{calPerKg} cal</td>
                  <td colSpan={2} />
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onBack} className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors">
            ← Atrás
          </button>
          <button
            onClick={onNext}
            disabled={totalPct !== 100}
            className="flex-1 py-3 rounded-xl font-medium text-white bg-blue-500 hover:bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
          >
            Continuar →
          </button>
        </div>
      </div>
    </div>
  );
}
