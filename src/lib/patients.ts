import { supabase } from './supabase';
import type { Patient, MacroDistribution, MetodoCalculo, Meal, Preparation, Ingredient } from '../types';

export interface SavedPatient {
  id: string;
  name: string;
  age: number;
  sex: 'M' | 'F';
  current_weight: number;
  ideal_weight: number | null;
  height_cm: number;
  created_at: string;
}

export interface SavedDiet {
  id: string;
  calories: number;
  calculation_method: string;
  carbs_pct: number;
  protein_pct: number;
  fat_pct: number;
  created_at: string;
}

// Trae los pacientes del nutriólogo autenticado, más recientes primero
export async function fetchPatients(): Promise<SavedPatient[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// Trae las dietas guardadas de un paciente, más recientes primero
export async function fetchDietsForPatient(patientId: string): Promise<SavedDiet[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('diets')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// Reconstruye las comidas/preparaciones/ingredientes de una dieta guardada
export async function fetchDietMeals(dietId: string): Promise<Meal[]> {
  if (!supabase) return [];

  const { data: mealRows, error: mealsError } = await supabase
    .from('diet_meals')
    .select('*')
    .eq('diet_id', dietId)
    .order('meal_order', { ascending: true });
  if (mealsError) throw mealsError;
  if (!mealRows || mealRows.length === 0) return [];

  const { data: ingredientRows, error: ingredientsError } = await supabase
    .from('diet_ingredients')
    .select('*')
    .in('meal_id', mealRows.map(m => m.id));
  if (ingredientsError) throw ingredientsError;

  return mealRows.map(mealRow => {
    const preparacionesMap = new Map<string, Preparation>();
    for (const row of (ingredientRows ?? []).filter(r => r.meal_id === mealRow.id)) {
      let prep = preparacionesMap.get(row.preparation_name);
      if (!prep) {
        prep = { id: crypto.randomUUID(), nombre: row.preparation_name, ingredientes: [] };
        preparacionesMap.set(row.preparation_name, prep);
      }
      const ingrediente: Ingredient = {
        id: crypto.randomUUID(),
        nombre: row.food_name,
        gramos: row.grams,
        equivalente: row.equivalent,
        unidad: row.unit,
      };
      prep.ingredientes.push(ingrediente);
    }
    return {
      id: mealRow.id,
      nombre: mealRow.name,
      icon: '',
      preparaciones: Array.from(preparacionesMap.values()),
    };
  });
}

// Guarda un paciente y su dieta actual (paciente + dieta + comidas + ingredientes)
export async function savePatientDiet(
  userId: string,
  patient: Patient,
  get: number,
  metodo: MetodoCalculo,
  macros: MacroDistribution,
  comidas: Meal[],
): Promise<string> {
  if (!supabase) throw new Error('Supabase no está configurado');

  const { data: patientRow, error: patientError } = await supabase
    .from('patients')
    .insert({
      user_id: userId,
      name: patient.nombre,
      age: patient.edad,
      sex: patient.sexo,
      current_weight: patient.pesoActual,
      ideal_weight: patient.pesoIdeal || null,
      height_cm: patient.talla,
    })
    .select()
    .single();
  if (patientError) throw patientError;

  const { data: dietRow, error: dietError } = await supabase
    .from('diets')
    .insert({
      user_id: userId,
      patient_id: patientRow.id,
      calories: Math.round(get),
      calculation_method: metodo,
      carbs_pct: macros.hdec,
      protein_pct: macros.prot,
      fat_pct: macros.lip,
    })
    .select()
    .single();
  if (dietError) throw dietError;

  for (let i = 0; i < comidas.length; i++) {
    const meal = comidas[i];
    const { data: mealRow, error: mealError } = await supabase
      .from('diet_meals')
      .insert({ diet_id: dietRow.id, name: meal.nombre, meal_order: i })
      .select()
      .single();
    if (mealError) throw mealError;

    const ingredientRows = meal.preparaciones.flatMap(prep =>
      prep.ingredientes.map(ing => ({
        meal_id: mealRow.id,
        preparation_name: prep.nombre,
        food_name: ing.nombre,
        grams: ing.gramos,
        equivalent: ing.equivalente,
        unit: ing.unidad,
      }))
    );
    if (ingredientRows.length > 0) {
      const { error: ingredientsError } = await supabase.from('diet_ingredients').insert(ingredientRows);
      if (ingredientsError) throw ingredientsError;
    }
  }

  return patientRow.id as string;
}
