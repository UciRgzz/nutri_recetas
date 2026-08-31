import { useState, useEffect } from 'react';
import type { Meal, Preparation, Ingredient, FoodGroup, Patient, MacroDistribution, MetodoCalculo } from '../types';
import {
  Plus, Trash2, AlarmClock, UtensilsCrossed, Sun, Sunset,
  Moon, Coffee, ArrowLeft, Printer, RefreshCw, CalendarDays, Save, Check,
} from 'lucide-react';
import { AlarmClockOff } from 'lucide-react';
import { generateDiet, calcEquivTable } from '../utils/dietGenerator';
import { abrirPlantillaSemanal } from '../utils/plantillaSemanal';
import { savePatientDiet } from '../lib/patients';
import logoSrc from '../assets/logo.png';

const MEAL_ICONS: Record<string, React.ReactNode> = {
  'Al despertar': <AlarmClockOff size={16} />,
  'Desayuno':     <Coffee size={16} />,
  'Medio día':    <Sun size={16} />,
  'Comida':       <UtensilsCrossed size={16} />,
  'Media tarde':  <Sunset size={16} />,
  'Cena':         <Moon size={16} />,
};

function uid() { return Math.random().toString(36).slice(2); }

interface Props {
  get: number;
  patient: Patient;
  macros: MacroDistribution;
  metodo: MetodoCalculo;
  grupos: FoodGroup[];
  comidas: Meal[];
  userId: string;
  onChange: (meals: Meal[]) => void;
  onBack: () => void;
}

export default function DietPlan({ get, patient, macros, metodo, grupos, comidas, userId, onChange, onBack }: Props) {
  const [activeTab, setActiveTab] = useState('Al despertar');
  const [bottomTab, setBottomTab] = useState<'nutrimentos' | 'equivalentes'>('equivalentes');
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState('');

  // Auto-generate on mount (always generate fresh diet when arriving at this step)
  useEffect(() => {
    const generated = generateDiet(grupos, get);
    onChange(generated);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const meals = comidas.length > 0 ? comidas : [];
  const activeMeal = meals.find(m => m.nombre === activeTab);

  const updateMeals = (updated: Meal[]) => onChange(updated);

  const guardarPaciente = async () => {
    setGuardando(true);
    setErrorGuardar('');
    try {
      await savePatientDiet(userId, patient, get, metodo, macros, meals);
      setGuardado(true);
      setTimeout(() => setGuardado(false), 3000);
    } catch (err) {
      setErrorGuardar(err instanceof Error ? err.message : 'No se pudo guardar el paciente');
    } finally {
      setGuardando(false);
    }
  };

  const regenerate = () => {
    const generated = generateDiet(grupos, get);
    onChange(generated);
    setActiveTab('Al despertar');
  };

  const exportarPDF = async () => {
    const source = document.getElementById('diet-plan-export');
    if (!source) return;

    const ensureHtml2Pdf = () => new Promise<void>((resolve, reject) => {
      const existing = (window as Window & { html2pdf?: unknown }).html2pdf;
      if (existing) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('No se pudo cargar el generador de PDF.'));
      document.body.appendChild(script);
    });

    try {
      await ensureHtml2Pdf();
    } catch (error) {
      console.error(error);
      return;
    }

    const clone = source.cloneNode(true) as HTMLElement;
    clone.id = 'diet-plan-export-pdf';
    clone.style.position = 'fixed';
    clone.style.left = '-9999px';
    clone.style.top = '0';
    clone.style.width = '794px';
    clone.style.background = '#ffffff';
    clone.style.zIndex = '2147483647';
    clone.style.padding = '0';
    clone.style.margin = '0';
    clone.style.boxSizing = 'border-box';
    clone.style.visibility = 'visible';
    clone.style.overflow = 'visible';

    const pdfStyle = document.createElement('style');
    pdfStyle.textContent = `
      @page { size: A4 portrait; margin: 10mm; }
      html, body { margin: 0 !important; padding: 0 !important; background: #fff; }
      body { font-family: 'Segoe UI', Arial, sans-serif; }
      #diet-plan-export-pdf {
        all: initial;
        display: block !important;
        width: 794px !important;
        max-width: 794px !important;
        background: #fff !important;
        color: #0f172a !important;
        font-family: 'Segoe UI', Arial, sans-serif !important;
      }
      #diet-plan-export-pdf * {
        box-sizing: border-box !important;
      }
      #diet-plan-export-pdf .border-b,
      #diet-plan-export-pdf .border-gray-100,
      #diet-plan-export-pdf .border-gray-200,
      #diet-plan-export-pdf .divide-y,
      #diet-plan-export-pdf .divide-gray-50 {
        border-color: rgba(148, 163, 184, 0.55) !important;
      }
      #diet-plan-export-pdf .shadow-sm,
      #diet-plan-export-pdf .shadow {
        box-shadow: none !important;
      }
      #diet-plan-export-pdf .overflow-hidden { overflow: visible !important; }
      #diet-plan-export-pdf .min-h-64 { min-height: auto !important; }
      #diet-plan-export-pdf .p-6 { padding: 1.25rem !important; }
      #diet-plan-export-pdf .px-4 { padding-left: 1rem !important; padding-right: 1rem !important; }
      #diet-plan-export-pdf .py-2 { padding-top: .5rem !important; padding-bottom: .5rem !important; }
      #diet-plan-export-pdf .py-3 { padding-top: .75rem !important; padding-bottom: .75rem !important; }
      #diet-plan-export-pdf .px-6 { padding-left: 1.5rem !important; padding-right: 1.5rem !important; }
      #diet-plan-export-pdf .text-xs { font-size: 11px !important; }
      #diet-plan-export-pdf .text-sm { font-size: 12px !important; }
      #diet-plan-export-pdf .text-gray-700 { color: #334155 !important; }
      #diet-plan-export-pdf .text-gray-500 { color: #64748b !important; }
      #diet-plan-export-pdf .bg-white { background: #fff !important; }
      #diet-plan-export-pdf .bg-gray-50 { background: #f8fafc !important; }
      #diet-plan-export-pdf .bg-emerald-500,
      #diet-plan-export-pdf .bg-teal-500,
      #diet-plan-export-pdf .bg-amber-500,
      #diet-plan-export-pdf .bg-rose-500 {
        box-shadow: none !important;
      }
    `;

    document.body.appendChild(clone);
    document.head.appendChild(pdfStyle);

    const cleanup = () => {
      pdfStyle.remove();
      clone.remove();
    };

    const html2pdf = (window as Window & { html2pdf?: (fn?: unknown) => any }).html2pdf;
    if (!html2pdf) {
      cleanup();
      return;
    }

    try {
      await html2pdf()
        .set({
          margin: [6, 6, 8, 6],
          filename: `plan-nutricional-${patient.nombre.replace(/\s+/g, '-').toLowerCase()}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            scrollX: 0,
            scrollY: 0,
            width: 794,
            windowWidth: 794,
          },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['css', 'legacy'] },
        })
        .from(clone)
        .save();
    } catch (error) {
      console.error(error);
    } finally {
      cleanup();
    }
  };

  const addPrep = () => {
    const updated = meals.map(m =>
      m.nombre !== activeTab ? m : {
        ...m,
        preparaciones: [...m.preparaciones, {
          id: uid(), nombre: 'Nueva preparación', ingredientes: [],
        } as Preparation],
      }
    );
    updateMeals(updated);
  };

  const removePrep = (prepId: string) => {
    const updated = meals.map(m =>
      m.nombre !== activeTab ? m : {
        ...m, preparaciones: m.preparaciones.filter(p => p.id !== prepId),
      }
    );
    updateMeals(updated);
  };

  const updatePrepName = (prepId: string, nombre: string) => {
    const updated = meals.map(m =>
      m.nombre !== activeTab ? m : {
        ...m, preparaciones: m.preparaciones.map(p =>
          p.id === prepId ? { ...p, nombre } : p
        ),
      }
    );
    updateMeals(updated);
  };

  const addIngredient = (prepId: string) => {
    const updated = meals.map(m =>
      m.nombre !== activeTab ? m : {
        ...m, preparaciones: m.preparaciones.map(p =>
          p.id !== prepId ? p : {
            ...p, ingredientes: [...p.ingredientes, {
              id: uid(), nombre: '', gramos: 0, equivalente: 0, unidad: '',
            } as Ingredient],
          }
        ),
      }
    );
    updateMeals(updated);
  };

  const updateIngredient = (prepId: string, ingId: string, field: keyof Ingredient, value: string | number) => {
    const updated = meals.map(m =>
      m.nombre !== activeTab ? m : {
        ...m, preparaciones: m.preparaciones.map(p =>
          p.id !== prepId ? p : {
            ...p, ingredientes: p.ingredientes.map(ing =>
              ing.id !== ingId ? ing : { ...ing, [field]: value }
            ),
          }
        ),
      }
    );
    updateMeals(updated);
  };

  const removeIngredient = (prepId: string, ingId: string) => {
    const updated = meals.map(m =>
      m.nombre !== activeTab ? m : {
        ...m, preparaciones: m.preparaciones.map(p =>
          p.id !== prepId ? p : {
            ...p, ingredientes: p.ingredientes.filter(ing => ing.id !== ingId),
          }
        ),
      }
    );
    updateMeals(updated);
  };

  const equivTable = calcEquivTable(grupos).filter(r => r.total > 0);
  const mealNames = ['Al despertar', 'Desayuno', 'Medio día', 'Comida', 'Media tarde', 'Cena'];

  return (
    <div id="diet-plan-export" className="max-w-5xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 border border-gray-200 rounded-lg px-3 py-1">
              Dieta automática {get} cals
            </span>
            <button
              onClick={regenerate}
              title="Regenerar dieta"
              className="flex items-center gap-1.5 text-xs text-emerald-500 hover:text-emerald-700 border border-emerald-200 rounded-lg px-3 py-1.5 hover:bg-emerald-50"
            >
              <RefreshCw size={13} /> Regenerar
            </button>
          </div>
          <div className="flex items-center gap-2">
            {errorGuardar && <span className="text-xs text-red-500 max-w-[180px]">{errorGuardar}</span>}
            <button
              onClick={guardarPaciente}
              disabled={guardando || !patient.nombre}
              title="Guardar paciente y dieta"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors disabled:opacity-50 ${
                guardado ? 'bg-green-600 text-white' : 'bg-emerald-500 text-white hover:bg-emerald-600'
              }`}
            >
              {guardado ? <Check size={14} /> : <Save size={14} />}
              {guardando ? 'Guardando...' : guardado ? 'Guardado' : 'Guardar paciente'}
            </button>
            <button
              onClick={() => abrirPlantillaSemanal(logoSrc, get, patient, macros, meals)}
              title="Crear plantilla de dieta semanal"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 text-white rounded-lg text-xs hover:bg-rose-600 transition-colors"
            >
              <CalendarDays size={14} /> Plantilla semanal
            </button>
            <button
              onClick={exportarPDF}
              title="Exportar PDF"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs hover:bg-amber-600 transition-colors"
            >
              <Printer size={14} /> Exportar PDF
            </button>
          </div>
        </div>

        {/* Meal tabs */}
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {mealNames.map(name => (
            <button
              key={name}
              onClick={() => setActiveTab(name)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm whitespace-nowrap border-b-2 transition-colors ${
                activeTab === name
                  ? 'border-emerald-500 text-emerald-600 font-medium'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {MEAL_ICONS[name]}
              {name}
            </button>
          ))}
        </div>

        {/* Meal content */}
        <div className="p-6 min-h-64">
          {activeMeal && (
            <>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white">
                  <UtensilsCrossed size={14} />
                </div>
                <span className="font-medium text-gray-700">{activeMeal.nombre}</span>
                <div className="ml-auto flex items-center gap-2 text-gray-400 text-xs">
                  <AlarmClock size={13} />
                  <span>--:-- -----</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {activeMeal.preparaciones.map(prep => (
                  <div key={prep.id} className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100">
                      <input
                        value={prep.nombre}
                        onChange={e => updatePrepName(prep.id, e.target.value)}
                        className="flex-1 bg-transparent text-sm text-gray-600 focus:outline-none font-medium"
                        placeholder="Nombre de la preparación..."
                      />
                      <button onClick={() => removePrep(prep.id)} className="text-gray-300 hover:text-red-400 ml-2">
                        <Trash2 size={13} />
                      </button>
                    </div>

                    {/* Column headers */}
                    <div className="grid grid-cols-[1fr_80px_20px_60px_80px_30px] gap-2 px-4 py-1 text-xs text-gray-400 border-b border-gray-50">
                      <span>Alimento</span>
                      <span className="text-center">Gramos</span>
                      <span></span>
                      <span className="text-center">Equiv.</span>
                      <span className="text-center">Unidad</span>
                      <span></span>
                    </div>

                    <div className="divide-y divide-gray-50">
                      {prep.ingredientes.map(ing => (
                        <div key={ing.id} className="grid grid-cols-[1fr_80px_20px_60px_80px_30px] gap-2 items-center px-4 py-1.5">
                          <input
                            value={ing.nombre}
                            onChange={e => updateIngredient(prep.id, ing.id, 'nombre', e.target.value)}
                            placeholder="Alimento"
                            className="text-sm text-gray-700 focus:outline-none border-b border-transparent focus:border-gray-300"
                          />
                          <input
                            type="number"
                            value={ing.gramos || ''}
                            onChange={e => updateIngredient(prep.id, ing.id, 'gramos', parseFloat(e.target.value) || 0)}
                            className="text-sm text-center text-gray-600 border-b border-transparent focus:border-gray-300 focus:outline-none w-full"
                          />
                          <span className="text-xs text-gray-400">g</span>
                          <input
                            type="number"
                            value={ing.equivalente || ''}
                            onChange={e => updateIngredient(prep.id, ing.id, 'equivalente', parseFloat(e.target.value) || 0)}
                            className="text-sm text-center text-gray-600 border-b border-transparent focus:border-gray-300 focus:outline-none w-full"
                          />
                          <input
                            value={ing.unidad}
                            onChange={e => updateIngredient(prep.id, ing.id, 'unidad', e.target.value)}
                            className="text-sm text-gray-400 focus:outline-none border-b border-transparent focus:border-gray-300 w-full"
                          />
                          <button onClick={() => removeIngredient(prep.id, ing.id)} className="text-gray-200 hover:text-red-400">
                            <Trash2 size={11} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="px-4 py-2 border-t border-gray-50">
                      <button onClick={() => addIngredient(prep.id)} className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-600">
                        <Plus size={11} /> Agregar alimento
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button onClick={addPrep} className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600">
                  <Plus size={13} /> Preparación
                </button>
              </div>
            </>
          )}
        </div>

        {/* Bottom summary */}
        <div className="border-t border-gray-100">
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setBottomTab('equivalentes')}
              className={`px-6 py-2 text-sm flex items-center gap-1.5 border-b-2 transition-colors ${
                bottomTab === 'equivalentes' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500'
              }`}
            >
              Total de equivalentes
            </button>
            <button
              onClick={() => setBottomTab('nutrimentos')}
              className={`px-6 py-2 text-sm flex items-center gap-1.5 border-b-2 transition-colors ${
                bottomTab === 'nutrimentos' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500'
              }`}
            >
              Nutrimentos
            </button>
          </div>

          {bottomTab === 'equivalentes' && (
            <div className="overflow-x-auto p-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-2 text-left font-semibold text-gray-600 pr-4">Grupo</th>
                    {mealNames.map(n => (
                      <th key={n} className="py-2 text-center font-semibold text-gray-600 px-2 text-xs">{n}</th>
                    ))}
                    <th className="py-2 text-center font-semibold text-gray-700 px-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {equivTable.map(row => (
                    <tr key={row.nombre} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-1.5 text-gray-600 pr-4 text-xs">{row.nombre}</td>
                      {row.perMeal.map((v, i) => (
                        <td key={i} className="py-1.5 text-center text-gray-500 px-2 text-xs">
                          {v > 0 ? v : '—'}
                        </td>
                      ))}
                      <td className="py-1.5 text-center font-semibold text-gray-700 px-2 text-xs">{row.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {bottomTab === 'nutrimentos' && (
            <div className="p-4">
              <NutrimentosTab grupos={grupos} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NutrimentosTab({ grupos }: { grupos: FoodGroup[] }) {
  const mealNames = ['Al despertar', 'Desayuno', 'Medio día', 'Comida', 'Media tarde', 'Cena'];

  const calcMealNuts = (mealName: string) => {
    const DIST: Record<string, number[]> = {
      'Verdura':                [10, 15,  0, 50, 25,  0],
      'Fruta':                  [25,  0, 25, 15,  0, 35],
      'Cereales y tubérculos':  [ 0, 33, 17, 33,  0, 17],
      'Cereales con grasa':     [ 0, 33, 17, 33,  0, 17],
      'Leguminosas':            [ 0,  0,  0,100,  0,  0],
      'O.A. muy bajo en grasa': [ 0,  0,  0, 50,  0, 50],
      'O.A. bajo en grasa':     [ 0, 25,  0, 50,  0, 25],
      'O.A. moderado en grasa': [ 0, 33,  0, 67,  0,  0],
      'O.A. alto en grasa':     [ 0, 33,  0, 67,  0,  0],
      'Leche descremada':       [50, 50,  0,  0,  0,  0],
      'Leche semidescremada':   [50, 50,  0,  0,  0,  0],
      'Leche entera':           [50, 50,  0,  0,  0,  0],
      'Grasa sin proteína':     [ 0, 25, 25, 25, 25,  0],
      'Grasa con proteína':     [ 0, 25, 25, 25, 25,  0],
      'Azúcar sin grasa':       [33, 33,  0, 33,  0,  0],
      'Azúcar con grasa':       [ 0, 50,  0, 50,  0,  0],
    };
    const idx = mealNames.indexOf(mealName);
    let hdec = 0, prot = 0, lip = 0, cal = 0;
    for (const g of grupos) {
      const d = DIST[g.nombre];
      if (!d) continue;
      const eq = g.equivalentes * (d[idx] / 100);
      hdec += g.hdecPorEq * eq;
      prot += g.protPorEq * eq;
      lip  += g.lipPorEq  * eq;
      cal  += g.calPorEq  * eq;
    }
    return { hdec: Math.round(hdec), prot: Math.round(prot), lip: Math.round(lip), cal: Math.round(cal) };
  };

  const rows = mealNames.map(n => ({ nombre: n, ...calcMealNuts(n) }));
  const totals = rows.reduce((a, r) => ({
    hdec: a.hdec + r.hdec, prot: a.prot + r.prot, lip: a.lip + r.lip, cal: a.cal + r.cal,
  }), { hdec: 0, prot: 0, lip: 0, cal: 0 });

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-200">
          <th className="py-2 text-left font-semibold text-gray-600">Tiempo de comida</th>
          <th className="py-2 text-center font-semibold text-green-600">HC (g)</th>
          <th className="py-2 text-center font-semibold text-orange-500">Prot (g)</th>
          <th className="py-2 text-center font-semibold text-blue-500">Lip (g)</th>
          <th className="py-2 text-center font-semibold text-gray-700">Calorías</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(r => (
          <tr key={r.nombre} className="border-b border-gray-50 hover:bg-gray-50">
            <td className="py-1.5 text-gray-600">{r.nombre}</td>
            <td className="py-1.5 text-center text-gray-600">{r.hdec}</td>
            <td className="py-1.5 text-center text-gray-600">{r.prot}</td>
            <td className="py-1.5 text-center text-gray-600">{r.lip}</td>
            <td className="py-1.5 text-center text-gray-700 font-medium">{r.cal}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className="border-t-2 border-gray-200 font-bold">
          <td className="py-2 text-gray-700">Total</td>
          <td className="py-2 text-center text-green-600">{totals.hdec}</td>
          <td className="py-2 text-center text-orange-500">{totals.prot}</td>
          <td className="py-2 text-center text-blue-500">{totals.lip}</td>
          <td className="py-2 text-center text-gray-700">{totals.cal}</td>
        </tr>
      </tfoot>
    </table>
  );
}
