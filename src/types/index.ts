export interface Patient {
  nombre: string;
  edad: number;
  sexo: 'M' | 'F';
  pesoActual: number;
  pesoIdeal: number;
  talla: number;
}

export type MetodoCalculo =
  | 'harris-benedict'
  | 'fao-oms-onu'
  | 'valencia'
  | 'mifflin-st-jeor'
  | 'gramos-por-kilo'
  | 'calorias-por-kilo';

export interface ActivityLevel {
  label: string;
  factor: number;
}

export interface MacroDistribution {
  hdec: number;
  prot: number;
  lip: number;
}

export interface FoodGroup {
  nombre: string;
  hdecPorEq: number;
  protPorEq: number;
  lipPorEq: number;
  calPorEq: number;
  equivalentes: number;
}

export interface Ingredient {
  id: string;
  nombre: string;
  gramos: number;
  equivalente: number;
  unidad: string;
}

export interface Preparation {
  id: string;
  nombre: string;
  imagen?: string;
  ingredientes: Ingredient[];
}

export interface Meal {
  id: string;
  nombre: string;
  icon: string;
  tip?: string;
  preparaciones: Preparation[];
}

export interface NutriState {
  step: number;
  patient: Patient;
  metodo: MetodoCalculo;
  actividadFisica: number;
  factorActividad: number;
  get: number;
  macros: MacroDistribution;
  gruposAlimentarios: FoodGroup[];
  comidas: Meal[];
}
