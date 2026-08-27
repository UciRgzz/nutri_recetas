import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, Check, Clock, CalendarDays, Loader2, X } from 'lucide-react';
import {
  fetchAppointmentsInRange, createAppointment, setAppointmentStatus, deleteAppointment,
  type Appointment,
} from '../lib/appointments';
import { fetchPatients, type SavedPatient } from '../lib/patients';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const DIAS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

const pad = (n: number) => n.toString().padStart(2, '0');
const isoDate = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const todayIso = () => { const d = new Date(); return isoDate(d.getFullYear(), d.getMonth(), d.getDate()); };

interface Props {
  userId: string;
}

export default function CalendarPanel({ userId }: Props) {
  const [viewDate, setViewDate] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [patients, setPatients] = useState<SavedPatient[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ patientName: '', time: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthKey = `${year}-${month}`;
  const loading = loadedKey !== monthKey;

  useEffect(() => {
    let cancelled = false;
    const start = isoDate(year, month, 1);
    const end = isoDate(year, month, new Date(year, month + 1, 0).getDate());
    fetchAppointmentsInRange(start, end)
      .then(data => {
        if (cancelled) return;
        setAppointments(data);
        setLoadedKey(monthKey);
        setError('');
      })
      .catch(err => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'No se pudieron cargar las citas');
        setLoadedKey(monthKey);
      });
    return () => { cancelled = true; };
  }, [year, month, monthKey]);

  useEffect(() => {
    fetchPatients().then(setPatients).catch(() => {});
  }, []);

  const byDate = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const a of appointments) {
      const list = map.get(a.appointment_date) ?? [];
      list.push(a);
      map.set(a.appointment_date, list);
    }
    return map;
  }, [appointments]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlanks = (new Date(year, month, 1).getDay() + 6) % 7;
  const cells: (number | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const changeMonth = (delta: number) => setViewDate(new Date(year, month + delta, 1));

  const selectedAppointments = byDate.get(selectedDate) ?? [];

  const openForm = (date: string) => {
    setSelectedDate(date);
    setForm({ patientName: '', time: '', notes: '' });
    setFormOpen(true);
  };

  const submitForm = async () => {
    if (!form.patientName.trim()) return;
    setSaving(true);
    try {
      const matched = patients.find(p => p.name.toLowerCase() === form.patientName.trim().toLowerCase());
      const created = await createAppointment(userId, {
        patientId: matched?.id ?? null,
        patientName: form.patientName.trim(),
        date: selectedDate,
        time: form.time,
        notes: form.notes,
      });
      setAppointments(prev => [...prev, created]);
      setFormOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo agendar la cita');
    } finally {
      setSaving(false);
    }
  };

  const toggleAttended = async (a: Appointment) => {
    const next = a.status === 'atendido' ? 'pendiente' : 'atendido';
    setAppointments(prev => prev.map(x => x.id === a.id ? { ...x, status: next } : x));
    try {
      await setAppointmentStatus(a.id, next);
    } catch (err) {
      setAppointments(prev => prev.map(x => x.id === a.id ? { ...x, status: a.status } : x));
      setError(err instanceof Error ? err.message : 'No se pudo actualizar la cita');
    }
  };

  const removeAppointment = async (a: Appointment) => {
    setAppointments(prev => prev.filter(x => x.id !== a.id));
    try {
      await deleteAppointment(a.id);
    } catch (err) {
      setAppointments(prev => [...prev, a]);
      setError(err instanceof Error ? err.message : 'No se pudo eliminar la cita');
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-1 flex items-center gap-2">
          <CalendarDays size={20} className="text-emerald-500" /> Calendario de citas
        </h2>
        <p className="text-sm text-gray-400 mb-4">Agenda pacientes y marca cuando ya fueron atendidos.</p>

        {error && <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">{error}</p>}

        <div className="flex items-center justify-between mb-4">
          <button onClick={() => changeMonth(-1)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
            <ChevronLeft size={18} />
          </button>
          <span className="font-semibold text-gray-700">{MESES[month]} {year}</span>
          <button onClick={() => changeMonth(1)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
            <ChevronRight size={18} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 text-gray-400 py-12">
            <Loader2 size={18} className="animate-spin" /> Cargando citas...
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1 mb-6">
            {DIAS.map((d, i) => (
              <div key={i} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
            ))}
            {cells.map((day, i) => {
              if (day === null) return <div key={i} />;
              const date = isoDate(year, month, day);
              const dayAppointments = byDate.get(date) ?? [];
              const isSelected = date === selectedDate;
              const isToday = date === todayIso();
              const hasAtendido = dayAppointments.some(a => a.status === 'atendido');
              const hasPendiente = dayAppointments.some(a => a.status === 'pendiente');
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(date)}
                  className={`relative h-14 rounded-lg text-sm flex flex-col items-center justify-center gap-0.5 transition-colors ${
                    isSelected ? 'bg-emerald-500 text-white' : isToday ? 'bg-emerald-50 text-emerald-600 font-semibold' : 'hover:bg-gray-50 text-gray-600'
                  }`}
                >
                  {day}
                  {(hasPendiente || hasAtendido) && (
                    <span className="flex gap-0.5">
                      {hasPendiente && <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-amber-400'}`} />}
                      {hasAtendido && <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-green-500'}`} />}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-700">
              Citas del {new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
            </h3>
            <button
              onClick={() => openForm(selectedDate)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs hover:bg-emerald-600"
            >
              <Plus size={13} /> Nueva cita
            </button>
          </div>

          {formOpen && (
            <div className="bg-gray-50 rounded-xl p-4 mb-3 flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="col-span-2 flex flex-col gap-1 text-xs text-gray-500">
                  Paciente
                  <input
                    list="patients-datalist"
                    value={form.patientName}
                    onChange={e => setForm({ ...form, patientName: e.target.value })}
                    placeholder="Nombre del paciente"
                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
                  />
                  <datalist id="patients-datalist">
                    {patients.map(p => <option key={p.id} value={p.name} />)}
                  </datalist>
                </label>
                <label className="flex flex-col gap-1 text-xs text-gray-500">
                  Hora
                  <input
                    type="time"
                    value={form.time}
                    onChange={e => setForm({ ...form, time: e.target.value })}
                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs text-gray-500">
                  Notas (opcional)
                  <input
                    value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                    placeholder="Motivo, observaciones..."
                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
                  />
                </label>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setFormOpen(false)} className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700">
                  <X size={13} /> Cancelar
                </button>
                <button
                  onClick={submitForm}
                  disabled={saving || !form.patientName.trim()}
                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs hover:bg-emerald-600 disabled:opacity-50"
                >
                  <Check size={13} /> {saving ? 'Guardando...' : 'Agendar'}
                </button>
              </div>
            </div>
          )}

          {selectedAppointments.length === 0 && !formOpen ? (
            <p className="text-sm text-gray-400 py-6 text-center">No hay citas agendadas este día.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {selectedAppointments.map(a => (
                <div key={a.id} className="flex items-center justify-between border border-gray-100 rounded-lg px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${a.status === 'atendido' ? 'bg-green-500' : 'bg-amber-400'}`} />
                    <div>
                      <p className="text-sm font-medium text-gray-700">{a.patient_name}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        {a.appointment_time && <><Clock size={11} /> {a.appointment_time}</>}
                        {a.notes && <span className="ml-1">· {a.notes}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleAttended(a)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-colors ${
                        a.status === 'atendido'
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                      }`}
                    >
                      <Check size={12} /> {a.status === 'atendido' ? 'Atendido' : 'Marcar atendido'}
                    </button>
                    <button onClick={() => removeAppointment(a)} className="text-gray-300 hover:text-red-400 p-1">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
