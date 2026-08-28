import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Loader2, Users, Pencil, Check, X, Search, CalendarDays, FileText, Download } from 'lucide-react';
import { fetchPatients, fetchDietsForPatient, fetchDietMeals, updatePatient, type SavedPatient, type SavedDiet } from '../lib/patients';
import { calcularIMC, clasificarIMC } from '../utils/calculations';
import { abrirPlantillaSemanal } from '../utils/plantillaSemanal';
import type { Patient, Meal } from '../types';
import logoSrc from '../assets/logo.png';
import DietDetailRow from './DietDetailRow';

type Html2Pdf = () => {
  set: (options: Record<string, unknown>) => {
    from: (element: HTMLElement) => { save: () => Promise<void> };
  };
};

type WindowWithHtml2Pdf = Window & { html2pdf?: Html2Pdf };

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
    const sourcePlan = document.getElementById('patient-plan-export');
    if (!sourcePlan) return;

    // Renderiza una copia normal y medible para que html2canvas capture todo el plan.
    const planRoot = sourcePlan.cloneNode(true) as HTMLElement;
    planRoot.id = 'patient-plan-pdf-copy';
    planRoot.style.position = 'absolute';
    planRoot.style.left = '0';
    planRoot.style.top = '0';
    planRoot.style.zIndex = '10000';
    planRoot.style.pointerEvents = 'none';
    document.body.appendChild(planRoot);

    const pdfStyle = document.createElement('style');
    pdfStyle.textContent = `
      @page { margin: 0; size: A4 portrait; }
      html, body { margin: 0 !important; padding: 0 !important; }
      #patient-plan-pdf-copy {
        width: 794px !important;
        max-width: 794px !important;
        min-width: 794px !important;
        margin: 0 !important;
        padding: 0 !important;
        box-sizing: border-box !important;
        display: block !important;
        overflow: visible !important;
      }
      #patient-plan-pdf-copy * {
        box-sizing: border-box !important;
      }
      #patient-plan-pdf-copy .px-5 { padding-left: 20px !important; padding-right: 20px !important; }
      #patient-plan-pdf-copy .py-4 { padding-top: 12px !important; padding-bottom: 12px !important; }
      #patient-plan-pdf-copy .p-4 { padding: 12px !important; }
      #patient-plan-pdf-copy .p-3 { padding: 9px !important; }
      #patient-plan-pdf-copy .px-4 { padding-left: 12px !important; padding-right: 12px !important; }
      #patient-plan-pdf-copy .py-3 { padding-top: 8px !important; padding-bottom: 8px !important; }
      #patient-plan-pdf-copy .py-2 { padding-top: 5px !important; padding-bottom: 5px !important; }
      #patient-plan-pdf-copy .mb-5 { margin-bottom: 12px !important; }
      #patient-plan-pdf-copy .mb-4 { margin-bottom: 10px !important; }
      #patient-plan-pdf-copy .mb-3 { margin-bottom: 7px !important; }
      #patient-plan-pdf-copy .mt-2 { margin-top: 5px !important; }
      #patient-plan-pdf-copy .gap-4 { gap: 12px !important; }
      #patient-plan-pdf-copy .gap-3 { gap: 8px !important; }
      #patient-plan-pdf-copy .text-5xl { font-size: 2.5rem !important; line-height: 1 !important; }
      #patient-plan-pdf-copy .text-3xl { font-size: 1.55rem !important; line-height: 1.1 !important; }
      #patient-plan-pdf-copy .text-2xl { font-size: 1.35rem !important; line-height: 1.15 !important; }
      #patient-plan-pdf-copy .text-xl { font-size: 1.05rem !important; line-height: 1.2 !important; }
      #patient-plan-pdf-copy .text-sm { font-size: 0.75rem !important; line-height: 1.25 !important; }
      #patient-plan-pdf-copy .text-xs { font-size: 0.6rem !important; line-height: 1.2 !important; }
      #patient-plan-pdf-copy .w-12 { width: 38px !important; }
      #patient-plan-pdf-copy .h-12 { height: 38px !important; }
      .plan-meal-block {
        break-inside: auto;
        page-break-inside: auto;
      }
      .plan-meal-block > div {
        break-inside: avoid;
        page-break-inside: avoid;
      }
    `;
    document.head.appendChild(pdfStyle);
    planRoot.style.height = `${planRoot.scrollHeight}px`;

    const cleanup = () => {
      pdfStyle.remove();
      planRoot.remove();
    };

    const runExport = () => {
      const html2pdf = (window as WindowWithHtml2Pdf).html2pdf;
      if (!html2pdf) {
        cleanup();
        setSaveError('No se pudo cargar el generador de PDF. Verifica tu conexión e inténtalo de nuevo.');
        return;
      }

      html2pdf()
        .set({
          margin: [0, 0, 0, 0],
          filename: `plan-nutricional-${patient.name.replace(/\s+/g, '-').toLowerCase()}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: 794,
            windowHeight: Math.max(window.innerHeight, planRoot.scrollHeight),
            width: 794,
            scrollX: 0,
            scrollY: 0,
          },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['css', 'legacy'] },
          enableLinks: false,
        })
        .from(planRoot)
        .save()
        .then(cleanup, (err: unknown) => {
          cleanup();
          setSaveError(err instanceof Error ? err.message : 'No se pudo generar el PDF');
        });
    };

    if ((window as WindowWithHtml2Pdf).html2pdf) {
      requestAnimationFrame(runExport);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.onload = () => requestAnimationFrame(runExport);
    script.onerror = () => {
      cleanup();
      setSaveError('No se pudo cargar el generador de PDF. Verifica tu conexión e inténtalo de nuevo.');
    };
    document.body.appendChild(script);
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
            <div id="patient-plan-export" className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
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
                  <div key={meal.id} className="plan-meal-block mb-4 rounded-xl border border-gray-200 overflow-hidden">
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
