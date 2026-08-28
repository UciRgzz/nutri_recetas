import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Loader2, Users, Pencil, Check, X, Search, CalendarDays, FileText, Download } from 'lucide-react';
import { fetchPatients, fetchDietsForPatient, fetchDietMeals, updatePatient, type SavedPatient, type SavedDiet } from '../lib/patients';
import { calcularIMC, clasificarIMC } from '../utils/calculations';
import { abrirPlantillaSemanal } from '../utils/plantillaSemanal';
import type { Patient, Meal } from '../types';
import logoSrc from '../assets/logo.png';
import DietDetailRow from './DietDetailRow';

async function imgToDataUrl(src: string): Promise<string> {
  const res = await fetch(src);
  const blob = await res.blob();
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

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
                onOpenPlan={() => setExpandedPatient(patient.id)}
                onUpdated={handleUpdated}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PatientRow({ patient, expanded, onToggle, onOpenPlan, onUpdated }: {
  patient: SavedPatient;
  expanded: boolean;
  onToggle: () => void;
  onOpenPlan: () => void;
  onUpdated: (updated: SavedPatient) => void;
}) {
  const [diets, setDiets] = useState<SavedDiet[] | null>(null);
  const [autoOpenDietId, setAutoOpenDietId] = useState<string | null>(null);
  const [planMeals, setPlanMeals] = useState<Meal[] | null>(null);
  const loadingDiets = expanded && diets === null;
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Patient>(() => toPatient(patient));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (!expanded || diets !== null) return;
    let cancelled = false;
    fetchDietsForPatient(patient.id).then(result => {
      if (!cancelled) {
        setDiets(result);
        if (result.length > 0) setAutoOpenDietId(result[0].id);
      }
    });
    return () => { cancelled = true; };
  }, [expanded, diets, patient.id]);

  useEffect(() => {
    if (expanded && diets && diets.length > 0 && !autoOpenDietId) {
      setAutoOpenDietId(diets[0].id);
    }
  }, [expanded, diets, autoOpenDietId]);

  useEffect(() => {
    if (!expanded || !diets || diets.length === 0) return;
    const latest = diets[0];
    let cancelled = false;
    fetchDietMeals(latest.id).then(meals => {
      if (!cancelled) setPlanMeals(meals);
    });
    return () => { cancelled = true; };
  }, [expanded, diets]);

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

  const exportPatientPlan = async () => {
    if (!diets || diets.length === 0) return;
    const latestDiet = diets[0];
    const meals = await fetchDietMeals(latestDiet.id);
    const logoDataUrl = await imgToDataUrl(logoSrc);
    const imc = patient.current_weight > 0 && patient.height_cm > 0
      ? calcularIMC(patient.current_weight, patient.height_cm)
      : 0;
    const grHC = Math.round((latestDiet.calories * latestDiet.carbs_pct / 100) / 4);
    const grProt = Math.round((latestDiet.calories * latestDiet.protein_pct / 100) / 4);
    const grLip = Math.round((latestDiet.calories * latestDiet.fat_pct / 100) / 9);
    const fecha = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
    const nombreArchivo = `plan-nutricional-${patient.name.replace(/\s+/g, '-').toLowerCase()}`;

    const mealColors: Record<string, { bg: string; accent: string; light: string; text: string }> = {
      'Al despertar': { bg: '#fef3c7', accent: '#d97706', light: '#fffbeb', text: '#78350f' },
      'Desayuno': { bg: '#d1fae5', accent: '#059669', light: '#f0fdf4', text: '#064e3b' },
      'Medio día': { bg: '#ffedd5', accent: '#ea580c', light: '#fff7ed', text: '#7c2d12' },
      'Comida': { bg: '#dbeafe', accent: '#2563eb', light: '#eff6ff', text: '#1e3a8a' },
      'Media tarde': { bg: '#ede9fe', accent: '#7c3aed', light: '#f5f3ff', text: '#4c1d95' },
      'Cena': { bg: '#e0e7ff', accent: '#4338ca', light: '#eef2ff', text: '#312e81' },
    };

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<title>Plan Nutricional – ${patient.name}</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"><\/script>
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #e2e8f0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; }
  #page { max-width: 840px; margin: 0 auto; background: #fff; padding: 0 0 32px; }
  .doc-header { background: linear-gradient(90deg,#1d4ed8,#1e40af); color: white; padding: 18px 26px; display: flex; align-items: center; gap: 20px; }
  .doc-header img { width: 84px; height: 84px; border-radius: 50%; background: #fff; padding: 6px; object-fit: contain; }
  .doc-header h1 { margin: 0; font-size: 28px; font-weight: 800; }
  .doc-header .sub { font-size: 12px; opacity: .9; margin-top: 4px; }
  .section-title { font-size: 14px; font-weight: 800; color: #1d4ed8; padding: 20px 20px 10px; border-left: 5px solid #3b82f6; margin: 24px 20px 12px; display: inline-block; letter-spacing: .5px; text-transform: uppercase; }
  .grid3, .grid2 { display: grid; gap: 12px; padding: 0 20px; }
  .grid3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .grid2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .card { background: #f8fafc; border: 1px solid #dbeafe; border-left: 4px solid #60a5fa; border-radius: 10px; padding: 10px 12px; min-height: 74px; }
  .card .lbl { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: .7px; margin-bottom: 4px; }
  .card .val { font-size: 18px; font-weight: 800; color: #0f172a; }
  .card.amber { border-left-color: #f59e0b; }
  .card.green { border-left-color: #22c55e; }
  .card.purple { border-left-color: #a855f7; }
  .card.red { border-left-color: #ef4444; }
  .hint { margin: 0 20px 14px; font-size: 11px; color: #64748b; text-align: right; }
  .macro-row { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; padding: 0 20px; margin-top: 4px; }
  .macro-pill { border-radius: 10px; padding: 12px 14px; text-align: center; }
  .macro-pill .p { font-size: 20px; font-weight: 800; }
  .macro-pill .l { font-size: 10px; text-transform: uppercase; letter-spacing: .5px; opacity: .8; margin-top: 2px; }
  .macro-pill .g { font-size: 12px; font-weight: 700; margin-top: 6px; }
  .meal-block { border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; margin: 0 20px 16px; page-break-inside: avoid; }
  .meal-header { font-size: 14px; font-weight: 700; padding: 10px 14px; border-bottom: 2px solid; }
  .meal-body { background: #f8fafc; padding: 10px 14px 12px; }
  .prep-name { background: #f1f5f9; border-left: 4px solid; border-radius: 4px; font-weight: 700; font-size: 12px; padding: 6px 10px; margin-bottom: 8px; }
  .ing-table { width: 100%; border-collapse: collapse; }
  .ing-table thead th { background: #334155; color: #fff; font-size: 10px; text-transform: uppercase; letter-spacing: .5px; padding: 6px 8px; }
  .ing-table thead th:first-child { text-align: left; }
  .ing-table tbody td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px; }
  .ing-table tbody td:not(:first-child) { text-align: center; }
  #downloadBtn { position: fixed; right: 18px; bottom: 18px; border: none; background: #16a34a; color: #fff; border-radius: 10px; padding: 12px 18px; font-weight: 700; cursor: pointer; box-shadow: 0 10px 30px rgba(22,163,74,.25); }
  @media print { body { background: white; } #downloadBtn { display:none !important; } }
</style>
</head>
<body>
<div id="page">
  <div class="doc-header">
    <img src="${logoDataUrl}" alt="logo" />
    <div>
      <h1>Plan Nutricional</h1>
      <div class="sub">${fecha} · Elaborado con Sistema Nutricional</div>
    </div>
  </div>

  <div class="section-title">Datos del paciente</div>
  <div class="hint">💡 Haz clic en cualquier valor en amarillo para editarlo antes de descargar</div>
  <div class="grid3">
    <div class="card"><div class="lbl">Nombre</div><div class="val">${patient.name}</div></div>
    <div class="card"><div class="lbl">Edad</div><div class="val">${patient.age} años</div></div>
    <div class="card"><div class="lbl">Sexo</div><div class="val">${patient.sex === 'F' ? 'Femenino' : 'Masculino'}</div></div>
  </div>

  <div class="grid2" style="margin-top:12px;">
    <div class="card amber"><div class="lbl">Peso actual</div><div class="val">${patient.current_weight} kg</div></div>
    <div class="card green"><div class="lbl">Peso ideal</div><div class="val">${patient.ideal_weight ?? 0} kg</div></div>
    <div class="card"><div class="lbl">Talla</div><div class="val">${patient.height_cm} cm</div></div>
    <div class="card purple"><div class="lbl">IMC</div><div class="val">${imc.toFixed(1)} · ${clasificarIMC(imc)}</div></div>
  </div>

  <div class="section-title">Requerimiento energético</div>
  <div class="grid2" style="padding:0 20px 0;">
    <div class="card" style="border-left-color:#60a5fa; min-height:80px;">
      <div class="lbl">GET – Gasto Energético Total</div>
      <div class="val" style="font-size:36px;">${latestDiet.calories}<span style="font-size:18px; font-weight:600; margin-left:6px;">kcal/día</span></div>
    </div>
  </div>
  <div class="macro-row" style="margin-top:12px;">
    <div class="macro-pill" style="background:#dbeafe; color:#1e3a8a;">
      <div class="p">${latestDiet.carbs_pct}%</div>
      <div class="l">HC</div>
      <div class="g">${grHC} g</div>
    </div>
    <div class="macro-pill" style="background:#dcfce7; color:#14532d;">
      <div class="p">${latestDiet.protein_pct}%</div>
      <div class="l">Proteínas</div>
      <div class="g">${grProt} g</div>
    </div>
    <div class="macro-pill" style="background:#ffedd5; color:#7c2d12;">
      <div class="p">${latestDiet.fat_pct}%</div>
      <div class="l">Lípidos</div>
      <div class="g">${grLip} g</div>
    </div>
  </div>

  <div class="section-title">Plan de dieta</div>
  ${meals.map(meal => {
      const c = mealColors[meal.nombre] || { bg: '#f1f5f9', accent: '#64748b', light: '#f8fafc', text: '#334155' };
      return `
      <div class="meal-block">
        <div class="meal-header" style="background:${c.bg}; color:${c.text}; border-bottom-color:${c.accent};">
          ${meal.nombre}
        </div>
        <div class="meal-body" style="background:${c.light};">
          ${meal.preparaciones.length === 0 ? '<div style="color:#94a3b8; font-size:12px;">Sin preparaciones asignadas</div>' : meal.preparaciones.map(prep => `
            <div style="margin-bottom:12px;">
              <div class="prep-name" style="border-left-color:${c.accent}; color:${c.text};">${prep.nombre}</div>
              <table class="ing-table">
                <thead><tr><th>Alimento</th><th>Gramos</th><th>Equiv.</th><th>Unidad</th></tr></thead>
                <tbody>
                  ${prep.ingredientes.map(ing => `
                    <tr>
                      <td>${ing.nombre}</td>
                      <td>${ing.gramos}</td>
                      <td>${ing.equivalente}</td>
                      <td>${ing.unidad}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `).join('')}
        </div>
      </div>`;
  }).join('')}
</div>
<button id="downloadBtn" onclick="descargar()">⬇ Descargar PDF</button>
<script>
function descargar() {
  var btn = document.getElementById('downloadBtn');
  btn.style.display = 'none';
  setTimeout(function() {
    var opt = {
      margin: [8, 8, 8, 8],
      filename: '${nombreArchivo}.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: function(clonedDoc) {
          clonedDoc.documentElement.style.cssText = 'margin:0;padding:0;background:#ffffff;';
          clonedDoc.body.style.cssText = 'margin:0;padding:0;background:#ffffff;';
          var p = clonedDoc.getElementById('page');
          if (p) {
            p.style.maxWidth = '100%';
            p.style.width = '820px';
            p.style.margin = '0';
            p.style.background = '#ffffff';
          }
        }
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(document.getElementById('page')).save().then(function(){ btn.style.display = 'inline-flex'; });
  }, 300);
}
<\/script>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
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
        <button
          onClick={onOpenPlan}
          title="Ver plan nutricional"
          className="text-gray-400 hover:text-emerald-600 p-1"
        >
          <FileText size={14} />
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
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-3 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 flex-1">
              <span>Peso ideal: <b className="text-gray-700">{patient.ideal_weight ?? '—'} kg</b></span>
              <span>Talla: <b className="text-gray-700">{patient.height_cm} cm</b></span>
              {imc && <span>IMC: <b className="text-gray-700">{imc.toFixed(1)}</b> ({clasificarIMC(imc)})</span>}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1.5 bg-emerald-500 text-white text-xs rounded-lg px-3 py-1.5 hover:bg-emerald-600"
              >
                <Pencil size={12} /> Editar
              </button>
              {diets && diets.length > 0 && (
                <button
                  onClick={() => { void exportPatientPlan(); }}
                  className="inline-flex items-center gap-1.5 bg-amber-500 text-white text-xs rounded-lg px-3 py-1.5 hover:bg-amber-600"
                >
                  <Download size={12} /> Descargar PDF
                </button>
              )}
            </div>
          </div>

          {loadingDiets && <span className="text-xs text-gray-400 flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Cargando dietas...</span>}
          {diets && diets.length === 0 && <span className="text-xs text-gray-400">Sin dietas guardadas para este paciente.</span>}

          {diets && diets.length > 0 && planMeals && (
            <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
              <div className="bg-gradient-to-r from-blue-700 to-blue-800 px-5 py-4 text-white flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-lg font-bold">P</div>
                <div>
                  <div className="text-2xl font-bold">Plan Nutricional</div>
                  <div className="text-xs opacity-80">{new Date(diets[0].created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })} · Elaborado con Sistema Nutricional</div>
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-center gap-2 text-blue-700 mb-3 font-extrabold uppercase text-sm tracking-wide">
                  <span className="w-1.5 h-8 rounded bg-blue-600 inline-block" /> Datos del paciente
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3">
                    <div className="text-[10px] uppercase tracking-[0.12em] text-gray-500 mb-1">Nombre</div>
                    <div className="text-xl font-bold text-gray-800">{patient.name}</div>
                  </div>
                  <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3">
                    <div className="text-[10px] uppercase tracking-[0.12em] text-gray-500 mb-1">Edad</div>
                    <div className="text-xl font-bold text-gray-800">{patient.age} años</div>
                  </div>
                  <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3">
                    <div className="text-[10px] uppercase tracking-[0.12em] text-gray-500 mb-1">Sexo</div>
                    <div className="text-xl font-bold text-gray-800">{patient.sex === 'F' ? 'Femenino' : 'Masculino'}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5">
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <div className="text-[10px] uppercase tracking-[0.12em] text-gray-500 mb-1">Peso actual</div>
                    <div className="text-2xl font-bold text-gray-800">{patient.current_weight} kg</div>
                  </div>
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                    <div className="text-[10px] uppercase tracking-[0.12em] text-gray-500 mb-1">Peso ideal</div>
                    <div className="text-2xl font-bold text-gray-800">{patient.ideal_weight ?? 0} kg</div>
                  </div>
                  <div className="rounded-xl border border-sky-200 bg-sky-50 p-3">
                    <div className="text-[10px] uppercase tracking-[0.12em] text-gray-500 mb-1">Talla</div>
                    <div className="text-2xl font-bold text-gray-800">{patient.height_cm} cm</div>
                  </div>
                  <div className="rounded-xl border border-violet-200 bg-violet-50 p-3">
                    <div className="text-[10px] uppercase tracking-[0.12em] text-gray-500 mb-1">IMC</div>
                    <div className="text-2xl font-bold text-gray-800">{imc?.toFixed(1) ?? '0.0'} · {imc ? clasificarIMC(imc) : '—'}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-blue-700 mb-3 font-extrabold uppercase text-sm tracking-wide">
                  <span className="w-1.5 h-8 rounded bg-blue-600 inline-block" /> Requerimiento energético
                </div>
                <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 mb-4">
                  <div className="text-[10px] uppercase tracking-[0.12em] text-gray-500">GET – Gasto Energético Total</div>
                  <div className="mt-2 text-5xl font-black text-gray-900">{diets[0].calories}<span className="text-xl align-middle ml-2 text-gray-700">kcal/día</span></div>
                </div>

                <div className="grid md:grid-cols-3 gap-3 mb-4 text-center">
                  <div className="rounded-xl bg-blue-100 p-4 text-blue-800">
                    <div className="text-3xl font-black">{diets[0].carbs_pct}%</div>
                    <div className="text-xs uppercase tracking-[0.12em] mt-1">Hidratos de carbono</div>
                    <div className="mt-2 font-bold">{Math.round((diets[0].calories * diets[0].carbs_pct / 100) / 4)} g</div>
                  </div>
                  <div className="rounded-xl bg-emerald-100 p-4 text-emerald-800">
                    <div className="text-3xl font-black">{diets[0].protein_pct}%</div>
                    <div className="text-xs uppercase tracking-[0.12em] mt-1">Proteínas</div>
                    <div className="mt-2 font-bold">{Math.round((diets[0].calories * diets[0].protein_pct / 100) / 4)} g</div>
                  </div>
                  <div className="rounded-xl bg-orange-100 p-4 text-orange-800">
                    <div className="text-3xl font-black">{diets[0].fat_pct}%</div>
                    <div className="text-xs uppercase tracking-[0.12em] mt-1">Lípidos</div>
                    <div className="mt-2 font-bold">{Math.round((diets[0].calories * diets[0].fat_pct / 100) / 9)} g</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-blue-700 mb-3 font-extrabold uppercase text-sm tracking-wide">
                  <span className="w-1.5 h-8 rounded bg-blue-600 inline-block" /> Plan de dieta
                </div>

                {planMeals?.map(meal => (
                  <div key={meal.id} className="mb-4 rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-4 py-3 bg-amber-100 text-amber-900 font-semibold border-b border-amber-200">{meal.nombre}</div>
                    <div className="bg-gray-50/80 p-3">
                      {meal.preparaciones.length === 0 ? <div className="text-sm text-gray-500">Sin preparaciones.</div> : meal.preparaciones.map(prep => (
                        <div key={prep.id} className="mb-3 last:mb-0">
                          <div className="font-medium text-gray-700 mb-2">{prep.nombre}</div>
                          <div className="overflow-hidden rounded-lg border border-gray-200">
                            <div className="grid grid-cols-[1.7fr_0.7fr_0.5fr_0.7fr] bg-slate-800 text-white text-[10px] uppercase tracking-[0.12em] px-3 py-2">
                              <span>Alimento</span>
                              <span className="text-center">Gramos</span>
                              <span className="text-center">Equiv.</span>
                              <span className="text-center">Unidad</span>
                            </div>
                            {prep.ingredientes.map(ing => (
                              <div key={ing.id} className="grid grid-cols-[1.7fr_0.7fr_0.5fr_0.7fr] px-3 py-2 border-t border-gray-200 bg-white text-sm text-gray-700">
                                <span>{ing.nombre}</span>
                                <span className="text-center">{ing.gramos}</span>
                                <span className="text-center">{ing.equivalente}</span>
                                <span className="text-center">{ing.unidad}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {diets && diets.length > 0 && planMeals && (
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1.5 bg-emerald-500 text-white text-xs rounded-lg px-3 py-1.5 hover:bg-emerald-600"
              >
                <Pencil size={12} /> Editar
              </button>
              <button
                onClick={() => { void exportPatientPlan(); }}
                className="inline-flex items-center gap-1.5 bg-amber-500 text-white text-xs rounded-lg px-3 py-1.5 hover:bg-amber-600"
              >
                <Download size={12} /> Descargar PDF
              </button>
            </div>
          )}

          {diets?.map(diet => (
            <DietDetailRow
              key={diet.id}
              diet={diet}
              defaultOpen={autoOpenDietId === diet.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
