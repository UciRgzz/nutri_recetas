import { supabase } from './supabase';

export interface Appointment {
  id: string;
  patient_id: string | null;
  patient_name: string;
  appointment_date: string;
  appointment_time: string | null;
  notes: string | null;
  status: 'pendiente' | 'atendido';
  created_at: string;
}

// Trae las citas dentro de un rango de fechas (inclusive), ordenadas por fecha y hora
export async function fetchAppointmentsInRange(startDate: string, endDate: string): Promise<Appointment[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .gte('appointment_date', startDate)
    .lte('appointment_date', endDate)
    .order('appointment_date', { ascending: true })
    .order('appointment_time', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// Agenda una nueva cita
export async function createAppointment(userId: string, input: {
  patientId: string | null;
  patientName: string;
  date: string;
  time: string;
  notes: string;
}): Promise<Appointment> {
  if (!supabase) throw new Error('Supabase no está configurado');
  const { data, error } = await supabase
    .from('appointments')
    .insert({
      user_id: userId,
      patient_id: input.patientId,
      patient_name: input.patientName,
      appointment_date: input.date,
      appointment_time: input.time || null,
      notes: input.notes || null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Marca/desmarca una cita como atendida
export async function setAppointmentStatus(id: string, status: 'pendiente' | 'atendido'): Promise<void> {
  if (!supabase) throw new Error('Supabase no está configurado');
  const { error } = await supabase.from('appointments').update({ status }).eq('id', id);
  if (error) throw error;
}

// Elimina una cita
export async function deleteAppointment(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase no está configurado');
  const { error } = await supabase.from('appointments').delete().eq('id', id);
  if (error) throw error;
}
