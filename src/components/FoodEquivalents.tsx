import { Play, Sparkles } from 'lucide-react';
import type { FoodGroup, MacroDistribution } from '../types';
import { generarEquivalentesAuto } from '../utils/calculations';

interface Props {
  get: number;
  macros: MacroDistribution;
  grupos: FoodGroup[];
  onChange: (grupos: FoodGroup[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function FoodEquivalents({ get, macros, grupos, onChange, onNext, onBack }: Props) {
  const grHdec = Math.round((get * macros.hdec / 100) / 4);
  const grProt = Math.round((get * macros.prot / 100) / 4);
  const grLip  = Math.round((get * macros.lip  / 100) / 9);

  const totales = grupos.reduce(
    (acc, g) => ({
      hdec: acc.hdec + g.hdecPorEq * g.equivalentes,
      prot: acc.prot + g.protPorEq * g.equivalentes,
      lip:  acc.lip  + g.lipPorEq  * g.equivalentes,
      cal:  acc.cal  + g.calPorEq  * g.equivalentes,
    }),
    { hdec: 0, prot: 0, lip: 0, cal: 0 }
  );

  const setEq = (idx: number, val: number) => {
    const updated = grupos.map((g, i) =>
      i === idx ? { ...g, equivalentes: Math.max(0, val) } : g
    );
    onChange(updated);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm p-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-2 text-center">Equivalentes por grupo alimentario</h2>

        <div className="flex justify-center gap-6 mb-6 text-sm">
          <span className="text-gray-500">Meta: <strong className="text-green-600">{grHdec}g HC</strong></span>
          <span className="text-gray-500">Meta: <strong className="text-orange-500">{grProt}g Prot</strong></span>
          <span className="text-gray-500">Meta: <strong className="text-blue-500">{grLip}g Lip</strong></span>
          <span className="text-gray-500">GET: <strong className="text-gray-700">{get} kcal</strong></span>
        </div>

        <div className="flex justify-center gap-3 mb-4">
          <button
            onClick={() => onChange(generarEquivalentesAuto(get, macros, grupos))}
            className="flex items-center gap-2 px-6 py-2 border border-emerald-400 text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors font-medium"
          >
            <Sparkles size={16} />
            Sugerir equivalentes
          </button>
          <button
            onClick={onNext}
            className="flex items-center gap-2 px-8 py-2 border border-green-400 text-green-600 rounded-lg hover:bg-green-50 transition-colors font-medium"
          >
            <Play size={16} fill="currentColor" />
            Generar dieta
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="py-3 text-left font-semibold text-gray-600">Grupo</th>
                <th className="py-3 text-center font-semibold text-gray-600">Equivalentes</th>
                <th className="py-3 text-center font-semibold text-gray-600">Hdec</th>
                <th className="py-3 text-center font-semibold text-gray-600">Prot</th>
                <th className="py-3 text-center font-semibold text-gray-600">Lip</th>
                <th className="py-3 text-center font-semibold text-gray-600">Calorías</th>
              </tr>
            </thead>
            <tbody>
              {grupos.map((g, i) => {
                const hdec = g.hdecPorEq * g.equivalentes;
                const prot = g.protPorEq * g.equivalentes;
                const lip  = g.lipPorEq  * g.equivalentes;
                const cal  = g.calPorEq  * g.equivalentes;
                return (
                  <tr key={g.nombre} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 text-gray-700">{g.nombre}</td>
                    <td className="py-2 text-center">
                      <input
                        type="number"
                        min={0}
                        step={0.5}
                        value={g.equivalentes || ''}
                        placeholder="0"
                        onChange={e => setEq(i, parseFloat(e.target.value) || 0)}
                        className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-emerald-300 text-sm"
                      />
                    </td>
                    <td className="py-2 text-center text-gray-600">{hdec || 0}</td>
                    <td className="py-2 text-center text-gray-600">{prot || 0}</td>
                    <td className="py-2 text-center text-gray-600">{lip || 0}</td>
                    <td className="py-2 text-center text-gray-600">{cal || 0}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-300 font-semibold">
                <td className="py-3 text-gray-700">Total</td>
                <td />
                <td className={`py-3 text-center ${Math.abs(totales.hdec - grHdec) < 5 ? 'text-green-600' : 'text-red-500'}`}>{totales.hdec.toFixed(1)}</td>
                <td className={`py-3 text-center ${Math.abs(totales.prot - grProt) < 5 ? 'text-green-600' : 'text-red-500'}`}>{totales.prot.toFixed(1)}</td>
                <td className={`py-3 text-center ${Math.abs(totales.lip - grLip) < 5 ? 'text-green-600' : 'text-red-500'}`}>{totales.lip.toFixed(1)}</td>
                <td className={`py-3 text-center ${Math.abs(totales.cal - get) < 50 ? 'text-green-600' : 'text-red-500'}`}>{totales.cal.toFixed(0)}</td>
              </tr>
              <tr className="text-xs text-gray-400">
                <td className="py-1">Meta</td>
                <td />
                <td className="text-center">{grHdec}</td>
                <td className="text-center">{grProt}</td>
                <td className="text-center">{grLip}</td>
                <td className="text-center">{get}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onBack} className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors">
            ← Atrás
          </button>
          <button
            onClick={onNext}
            className="flex-1 py-3 rounded-xl font-medium text-white bg-green-500 hover:bg-green-600 transition-colors"
          >
            Generar dieta →
          </button>
        </div>
      </div>
    </div>
  );
}
