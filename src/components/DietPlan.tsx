import { useState, useEffect } from 'react';
import type { Meal, Preparation, Ingredient, FoodGroup, Patient, MacroDistribution, MetodoCalculo } from '../types';
import {
  Plus, Trash2, AlarmClock, UtensilsCrossed, Sun, Sunset,
  Moon, Coffee, ArrowLeft, Printer, RefreshCw, CalendarDays, Save, Check,
} from 'lucide-react';
import { AlarmClockOff } from 'lucide-react';
import { generateDiet, calcEquivTable } from '../utils/dietGenerator';
import { calcularIMC, clasificarIMC } from '../utils/calculations';
import { abrirPlantillaSemanal } from '../utils/plantillaSemanal';
import { savePatientDiet } from '../lib/patients';
import logoSrc from '../assets/logo.png';

async function imgToDataUrl(src: string): Promise<string> {
  const res = await fetch(src);
  const blob = await res.blob();
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

const MEAL_ICONS: Record<string, React.ReactNode> = {
  'Al despertar': <AlarmClockOff size={16} />,
  'Desayuno':     <Coffee size={16} />,
  'Medio día':    <Sun size={16} />,
  'Comida':       <UtensilsCrossed size={16} />,
  'Media tarde':  <Sunset size={16} />,
  'Cena':         <Moon size={16} />,
};

function uid() { return Math.random().toString(36).slice(2); }

const METODO_LABEL: Record<MetodoCalculo, string> = {
  'harris-benedict':  'Harris-Benedict',
  'fao-oms-onu':      'FAO/OMS/ONU',
  'valencia':         'Valencia',
  'mifflin-st-jeor':  'Mifflin-St Jeor',
  'gramos-por-kilo':  'g/kg de peso',
  'calorias-por-kilo':'kcal/kg de peso',
};

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
    const logoDataUrl = await imgToDataUrl(logoSrc);
    const imc = calcularIMC(patient.pesoActual, patient.talla);
    const grHC   = Math.round((get * macros.hdec / 100) / 4);
    const grProt = Math.round((get * macros.prot / 100) / 4);
    const grLip  = Math.round((get * macros.lip  / 100) / 9);
    const gruposActivos = grupos.filter(g => g.equivalentes > 0);
    const totEq = gruposActivos.reduce(
      (a, g) => ({ hc: a.hc + g.hdecPorEq*g.equivalentes, prot: a.prot + g.protPorEq*g.equivalentes,
                   lip: a.lip + g.lipPorEq*g.equivalentes, cal: a.cal + g.calPorEq*g.equivalentes }),
      { hc: 0, prot: 0, lip: 0, cal: 0 }
    );

    const mealColors: Record<string, { bg: string; accent: string; light: string; text: string }> = {
      'Al despertar': { bg: '#fef3c7', accent: '#d97706', light: '#fffbeb', text: '#78350f' },
      'Desayuno':     { bg: '#d1fae5', accent: '#059669', light: '#f0fdf4', text: '#064e3b' },
      'Medio día':    { bg: '#ffedd5', accent: '#ea580c', light: '#fff7ed', text: '#7c2d12' },
      'Comida':       { bg: '#dbeafe', accent: '#2563eb', light: '#eff6ff', text: '#1e3a8a' },
      'Media tarde':  { bg: '#ede9fe', accent: '#7c3aed', light: '#f5f3ff', text: '#4c1d95' },
      'Cena':         { bg: '#e0e7ff', accent: '#4338ca', light: '#eef2ff', text: '#312e81' },
    };

    const nombreArchivo = `plan-nutricional-${patient.nombre.replace(/\s+/g, '-').toLowerCase()}`;
    const fecha = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<title>Plan Nutricional – ${patient.nombre}</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"><\/script>
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #1e293b; margin: 0; padding: 20px; background: #e2e8f0; }
  #page { max-width: 820px; margin: 0 auto; background: #ffffff; padding: 32px 36px 100px; }

  /* Header */
  .doc-header { background-color: #1e3a8a; color: white; border-radius: 10px; padding: 16px 24px; margin-bottom: 24px; display: flex; align-items: center; gap: 18px; }
  .doc-header img { width: 90px; height: 90px; object-fit: contain; background: white; border-radius: 50%; padding: 4px; flex-shrink: 0; }
  .doc-header h1 { margin: 0 0 4px; font-size: 20px; font-weight: 700; letter-spacing: 0.5px; }
  .doc-header .sub { font-size: 11px; opacity: 0.8; }

  /* Section titles */
  .section-title { font-size: 13px; font-weight: 700; color: #1e40af; border-left: 4px solid #3b82f6; padding: 4px 0 4px 10px; margin: 20px 0 10px; text-transform: uppercase; letter-spacing: 0.5px; }

  /* Info grid */
  .grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 8px; }
  .grid2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 8px; }
  .info-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; }
  .info-card .lbl { font-size: 9px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
  .info-card .val { font-size: 14px; font-weight: 700; color: #0f172a; }
  .info-card.green { border-left: 3px solid #22c55e; }
  .info-card.blue  { border-left: 3px solid #3b82f6; }
  .info-card.amber { border-left: 3px solid #f59e0b; }
  .info-card.red   { border-left: 3px solid #ef4444; }
  .info-card.purple{ border-left: 3px solid #a855f7; }

  /* Macros bar */
  .macros-row { display: flex; gap: 8px; margin-bottom: 16px; }
  .macro-pill { flex: 1; border-radius: 8px; padding: 8px 12px; text-align: center; }
  .macro-pill .mp { font-size: 18px; font-weight: 800; }
  .macro-pill .ml { font-size: 9px; opacity: 0.8; margin-top: 1px; }

  /* Equivalents table */
  .eq-table { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
  .eq-table thead tr { background: #1e40af; color: white; }
  .eq-table thead th { padding: 7px 8px; font-size: 10px; font-weight: 600; text-align: center; }
  .eq-table thead th:first-child { text-align: left; }
  .eq-table tbody tr:nth-child(even) { background: #f8fafc; }
  .eq-table tbody tr:hover { background: #eff6ff; }
  .eq-table tbody td { padding: 5px 8px; border-bottom: 1px solid #e2e8f0; }
  .eq-table tbody td:not(:first-child) { text-align: center; color: #374151; }
  .eq-table tfoot .tot td { font-weight: 700; background: #dbeafe; padding: 6px 8px; border-top: 2px solid #93c5fd; }
  .eq-table tfoot .tot td:not(:first-child) { text-align: center; color: #1e3a8a; }
  .eq-table tfoot .meta td { font-size: 9px; color: #94a3b8; padding: 3px 8px; background: #f8fafc; }
  .eq-table tfoot .meta td:not(:first-child) { text-align: center; }

  /* Meal blocks */
  .meal-block { border-radius: 10px; overflow: hidden; margin-bottom: 14px; border: 1px solid #e2e8f0; page-break-inside: avoid; }
  .meal-header { padding: 8px 14px; font-weight: 700; font-size: 12px; display: flex; align-items: center; gap: 6px; }
  .meal-body { padding: 10px 14px; background: white; }
  .prep-block { margin-bottom: 10px; }
  .prep-name { font-weight: 600; font-size: 11px; color: #374151; padding: 4px 8px; background: #f1f5f9; border-radius: 4px; margin-bottom: 4px; }
  .ing-table { width: 100%; border-collapse: collapse; }
  .ing-table thead tr { background: #334155; color: white; }
  .ing-table thead th { padding: 4px 8px; font-size: 9px; font-weight: 600; }
  .ing-table thead th:first-child { text-align: left; }
  .ing-table thead th:not(:first-child) { text-align: center; }
  .ing-table tbody tr:nth-child(even) { background: #f8fafc; }
  .ing-table tbody td { padding: 3px 8px; border-bottom: 1px solid #f1f5f9; font-size: 10px; }
  .ing-table tbody td:not(:first-child) { text-align: center; color: #475569; }

  /* Editable hint */
  [contenteditable="true"] { outline: none; border-radius: 2px; cursor: text; }
  [contenteditable="true"]:hover { background: rgba(250,204,21,0.2); outline: 1px dashed #ca8a04; }
  [contenteditable="true"]:focus { background: rgba(250,204,21,0.25); outline: 2px solid #ca8a04; }
  .edit-hint { font-size: 9px; color: #94a3b8; text-align: right; margin-bottom: 6px; }

  /* Download button */
  #btn-download {
    position: fixed; bottom: 24px; right: 24px;
    background: #16a34a; color: white;
    border: none; border-radius: 10px;
    padding: 13px 26px; font-size: 14px; font-weight: 700;
    cursor: pointer; box-shadow: 0 4px 14px rgba(0,0,0,0.25);
    display: flex; align-items: center; gap: 8px;
    transition: background 0.2s;
    z-index: 999;
  }
  #btn-download:hover { background: #15803d; }

  @media print {
    body { background: white; }
    #btn-download { display: none !important; }
    #page { padding: 16px; box-shadow: none; }
  }
</style>
</head>
<body>
<div id="page">

  <!-- Header -->
  <div class="doc-header">
    <img src="${logoDataUrl}" alt="Lic Nutrición" />
    <div>
      <h1>Plan Nutricional</h1>
      <div class="sub">${fecha} &nbsp;·&nbsp; Elaborado con Sistema Nutricional</div>
    </div>
  </div>

  <!-- Datos del paciente -->
  <div class="section-title">Datos del Paciente</div>
  <p class="edit-hint">💡 Haz clic en cualquier valor en <span style="background:rgba(250,204,21,0.3);padding:0 4px;border-radius:2px">amarillo</span> para editarlo antes de descargar</p>
  <div class="grid3">
    <div class="info-card blue">
      <div class="lbl">Nombre</div>
      <div class="val" contenteditable="true">${patient.nombre}</div>
    </div>
    <div class="info-card">
      <div class="lbl">Edad</div>
      <div class="val" contenteditable="true">${patient.edad} años</div>
    </div>
    <div class="info-card">
      <div class="lbl">Sexo</div>
      <div class="val">${patient.sexo === 'F' ? 'Femenino' : 'Masculino'}</div>
    </div>
    <div class="info-card amber">
      <div class="lbl">Peso actual</div>
      <div class="val" contenteditable="true">${patient.pesoActual} kg</div>
    </div>
    <div class="info-card green">
      <div class="lbl">Peso ideal (Lorentz)</div>
      <div class="val" contenteditable="true">${patient.pesoIdeal} kg</div>
    </div>
    <div class="info-card">
      <div class="lbl">Talla</div>
      <div class="val">${patient.talla} cm</div>
    </div>
  </div>
  <div class="grid2" style="margin-top:8px">
    <div class="info-card ${imc < 18.5 ? 'amber' : imc < 25 ? 'green' : imc < 30 ? 'amber' : 'red'}">
      <div class="lbl">IMC</div>
      <div class="val">${imc.toFixed(1)} &nbsp;<span style="font-size:11px;font-weight:400">– ${clasificarIMC(imc)}</span></div>
    </div>
    <div class="info-card purple">
      <div class="lbl">Método de cálculo</div>
      <div class="val" style="font-size:12px">${METODO_LABEL[metodo]}</div>
    </div>
  </div>

  <!-- GET y macros -->
  <div class="section-title">Requerimiento Energético</div>
  <div class="info-card blue" style="margin-bottom:10px">
    <div class="lbl">GET – Gasto Energético Total</div>
    <div class="val" style="font-size:22px">${get} <span style="font-size:13px;font-weight:400">kcal/día</span></div>
  </div>
  <div class="macros-row">
    <div class="macro-pill" style="background:#dbeafe;color:#1e3a8a">
      <div class="mp">${macros.hdec}%</div>
      <div class="ml">Hidratos de carbono</div>
      <div style="font-size:13px;font-weight:700;margin-top:3px">${grHC} g</div>
    </div>
    <div class="macro-pill" style="background:#dcfce7;color:#14532d">
      <div class="mp">${macros.prot}%</div>
      <div class="ml">Proteínas</div>
      <div style="font-size:13px;font-weight:700;margin-top:3px">${grProt} g</div>
    </div>
    <div class="macro-pill" style="background:#ffedd5;color:#7c2d12">
      <div class="mp">${macros.lip}%</div>
      <div class="ml">Lípidos</div>
      <div style="font-size:13px;font-weight:700;margin-top:3px">${grLip} g</div>
    </div>
  </div>

  <!-- Equivalentes -->
  <div class="section-title">Equivalentes por Grupo Alimentario</div>
  <table class="eq-table">
    <thead>
      <tr>
        <th style="text-align:left">Grupo alimentario</th>
        <th>Equiv.</th>
        <th>HC (g)</th>
        <th>Prot (g)</th>
        <th>Lip (g)</th>
        <th>Calorías</th>
      </tr>
    </thead>
    <tbody>
      ${gruposActivos.map(g => `
      <tr>
        <td>${g.nombre}</td>
        <td>${g.equivalentes}</td>
        <td>${(g.hdecPorEq * g.equivalentes).toFixed(1)}</td>
        <td>${(g.protPorEq * g.equivalentes).toFixed(1)}</td>
        <td>${(g.lipPorEq  * g.equivalentes).toFixed(1)}</td>
        <td>${(g.calPorEq  * g.equivalentes).toFixed(0)}</td>
      </tr>`).join('')}
    </tbody>
    <tfoot>
      <tr class="tot">
        <td>Total</td><td></td>
        <td>${totEq.hc.toFixed(1)}</td>
        <td>${totEq.prot.toFixed(1)}</td>
        <td>${totEq.lip.toFixed(1)}</td>
        <td>${totEq.cal.toFixed(0)}</td>
      </tr>
      <tr class="meta">
        <td>Meta</td><td></td>
        <td>${grHC}</td>
        <td>${grProt}</td>
        <td>${grLip}</td>
        <td>${get}</td>
      </tr>
    </tfoot>
  </table>

  <!-- Plan de dieta -->
  <div class="section-title" style="margin-top:24px">Plan de Dieta</div>
  ${meals.map(meal => {
    const c = mealColors[meal.nombre] || { bg: '#f1f5f9', accent: '#64748b', light: '#f8fafc', text: '#334155' };
    return `
  <div class="meal-block">
    <div class="meal-header" style="background:${c.bg};color:${c.text};border-bottom:2px solid ${c.accent}">
      <span style="width:10px;height:10px;border-radius:50%;background:${c.accent};display:inline-block"></span>
      ${meal.nombre}
    </div>
    <div class="meal-body" style="background:${c.light}">
      ${meal.preparaciones.length === 0
        ? '<p style="color:#94a3b8;font-size:10px;margin:0">Sin preparaciones asignadas</p>'
        : meal.preparaciones.map(prep => `
      <div class="prep-block">
        <div class="prep-name" contenteditable="true" style="border-left:3px solid ${c.accent}">${prep.nombre}</div>
        <table class="ing-table">
          <thead><tr>
            <th>Alimento</th><th>Gramos</th><th>Equiv.</th><th>Unidad</th>
          </tr></thead>
          <tbody>
            ${prep.ingredientes.map(ing => `
            <tr>
              <td contenteditable="true">${ing.nombre}</td>
              <td contenteditable="true">${ing.gramos}</td>
              <td>${ing.equivalente}</td>
              <td contenteditable="true">${ing.unidad}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>`).join('')}
    </div>
  </div>`;
  }).join('')}

  <!-- Observaciones -->
  <div class="section-title" style="margin-top:20px">Observaciones</div>
  <div contenteditable="true" style="
    min-height:60px; border:1px dashed #cbd5e1; border-radius:8px;
    padding:10px 14px; font-size:11px; color:#64748b; line-height:1.6;
  ">Escribe aquí cualquier indicación adicional para el paciente...</div>

</div><!-- /#page -->

<!-- Botón descarga fijo -->
<button id="btn-download" onclick="descargar()">
  ⬇ Descargar PDF
</button>

<script>
function descargar() {
  var btn = document.getElementById('btn-download');
  btn.style.display = 'none';
  setTimeout(function() {
    var opt = {
      margin:   [8, 8, 8, 8],
      filename: '${nombreArchivo}.pdf',
      image:    { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: function(clonedDoc) {
          // Quitar el body gris centrado para que no se recorte
          clonedDoc.body.style.cssText = 'margin:0;padding:0;background:#ffffff;';
          var p = clonedDoc.getElementById('page');
          if (p) {
            p.style.maxWidth = 'none';
            p.style.width = '794px';
            p.style.margin = '0';
            p.style.padding = '24px 32px 50px';
            p.style.background = '#ffffff';
          }
        }
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(document.getElementById('page')).save()
      .then(function() { btn.style.display = 'flex'; });
  }, 300);
}
<\/script>
</body></html>`;

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
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
    <div className="max-w-5xl mx-auto">
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
              className="flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-700 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50"
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
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 transition-colors"
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
                  ? 'border-blue-500 text-blue-600 font-medium'
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
                      <button onClick={() => addIngredient(prep.id)} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-600">
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
                bottomTab === 'equivalentes' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'
              }`}
            >
              Total de equivalentes
            </button>
            <button
              onClick={() => setBottomTab('nutrimentos')}
              className={`px-6 py-2 text-sm flex items-center gap-1.5 border-b-2 transition-colors ${
                bottomTab === 'nutrimentos' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'
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
