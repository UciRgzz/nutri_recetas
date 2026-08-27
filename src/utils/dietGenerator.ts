import type { FoodGroup, Meal, Preparation, Ingredient } from '../types';
import { foodDatabase, groupKeyMap } from './foodDatabase';

// [Al despertar, Desayuno, Medio día, Comida, Media tarde, Cena]
export const MEAL_DIST: Record<string, number[]> = {
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

const MEAL_NAMES = ['Al despertar', 'Desayuno', 'Medio día', 'Comida', 'Media tarde', 'Cena'];

function uid() { return Math.random().toString(36).slice(2); }

function rnd<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

// Which food groups go into each preparation slot per meal
// Each inner array = one preparation; groups inside are merged into that prep
const PREP_SLOTS: Record<string, { groups: string[]; nameFn: (present: string[]) => string }[]> = {
  'Al despertar': [
    {
      groups: ['Fruta', 'Leche descremada', 'Leche semidescremada', 'Leche entera', 'Azúcar sin grasa', 'Azúcar con grasa'],
      nameFn: (p) => p.includes('Fruta')
        ? rnd(['Jugo natural de fruta', 'Bebida de frutas', 'Licuado de fruta', 'Fruta fresca de temporada'])
        : rnd(['Leche con café', 'Yogur natural', 'Vaso de leche']),
    },
  ],
  'Desayuno': [
    {
      groups: ['O.A. muy bajo en grasa','O.A. bajo en grasa','O.A. moderado en grasa','O.A. alto en grasa',
                'Verdura','Cereales y tubérculos','Cereales con grasa','Grasa sin proteína','Grasa con proteína','Azúcar sin grasa'],
      nameFn: (p) => {
        if (p.includes('O.A. moderado en grasa') || p.includes('O.A. alto en grasa'))
          return rnd(['Huevos revueltos con verduras','Omelette de verduras','Huevos a la mexicana','Chilaquiles con huevo','Huevos rancheros']);
        if (p.includes('O.A. bajo en grasa') || p.includes('O.A. muy bajo en grasa'))
          return rnd(['Quesadillas de pavo','Pechuga con verduras','Sándwich integral de pollo','Ensalada de atún con tostadas']);
        return rnd(['Avena con fruta y miel','Pan tostado con aguacate','Tostadas con frijoles','Cereal con leche']);
      },
    },
    {
      groups: ['Fruta'],
      nameFn: () => rnd(['Fruta fresca de temporada','Fruta picada con limón','Ensalada de frutas']),
    },
    {
      groups: ['Leche descremada','Leche semidescremada','Leche entera'],
      nameFn: () => rnd(['Vaso de leche','Yogur natural','Leche con café de olla']),
    },
  ],
  'Medio día': [
    {
      groups: ['Fruta','Cereales y tubérculos','Cereales con grasa','Grasa sin proteína','Grasa con proteína',
                'Leche descremada','Leche semidescremada','Azúcar sin grasa'],
      nameFn: (p) => {
        if (p.includes('Fruta') && (p.includes('Cereales y tubérculos') || p.includes('Cereales con grasa')))
          return rnd(['Fruta con granola','Pan tostado con mermelada y fruta','Galletas con fruta']);
        if (p.includes('Fruta'))
          return rnd(['Fruta fresca','Licuado de fruta','Fruta con yogur']);
        return rnd(['Tostadas con aguacate','Galletas integrales con queso','Colación saludable']);
      },
    },
  ],
  'Comida': [
    {
      groups: ['O.A. muy bajo en grasa','O.A. bajo en grasa','O.A. moderado en grasa','O.A. alto en grasa',
                'Verdura','Grasa sin proteína','Grasa con proteína'],
      nameFn: (p) => {
        if (p.includes('O.A. muy bajo en grasa'))
          return rnd(['Pechuga a la plancha con ensalada','Filete de pescado al vapor','Ensalada de atún','Pollo en salsa verde']);
        if (p.includes('O.A. bajo en grasa'))
          return rnd(['Pollo asado con verduras','Pescado al mojo de ajo','Pechuga en salsa roja','Pollo con nopal']);
        if (p.includes('O.A. moderado en grasa'))
          return rnd(['Bistec encebollado con nopal','Milanesa de res con ensalada','Carne al vapor con verduras','Filete de res con chile']);
        if (p.includes('O.A. alto en grasa'))
          return rnd(['Guisado de la abuela','Platillo de carne guisada','Estofado de res']);
        return rnd(['Sopa de verduras','Guisado vegetariano','Calabazas rellenas']);
      },
    },
    {
      groups: ['Cereales y tubérculos','Cereales con grasa'],
      nameFn: () => rnd(['Tortillas de maíz','Arroz rojo','Arroz con verduras','Sopa de pasta','Papa al vapor']),
    },
    {
      groups: ['Leguminosas'],
      nameFn: () => rnd(['Frijoles de olla','Lentejas con chile','Garbanzo guisado','Habas con epazote']),
    },
    {
      groups: ['Fruta','Azúcar sin grasa','Azúcar con grasa'],
      nameFn: () => rnd(['Agua fresca de fruta','Fruta de postre','Gelatina con fruta']),
    },
  ],
  'Media tarde': [
    {
      groups: ['Fruta','Verdura','Cereales y tubérculos','Cereales con grasa','Grasa sin proteína','Grasa con proteína',
                'Leche descremada','Leche semidescremada','Azúcar sin grasa'],
      nameFn: (p) => {
        if (p.includes('Verdura'))
          return rnd(['Verduras con limón y chile','Ensalada de pepino y jitomate','Jícama con chile']);
        if (p.includes('Fruta'))
          return rnd(['Fruta fresca','Fruta con granola y yogur','Licuado verde']);
        return rnd(['Tostadas con aguacate','Colación vespertina','Galletas con queso panela']);
      },
    },
  ],
  'Cena': [
    {
      groups: ['O.A. muy bajo en grasa','O.A. bajo en grasa','O.A. moderado en grasa','O.A. alto en grasa',
                'Verdura','Grasa sin proteína','Grasa con proteína','Cereales y tubérculos','Cereales con grasa'],
      nameFn: (p) => {
        if (p.includes('O.A. muy bajo en grasa') || p.includes('O.A. bajo en grasa'))
          return rnd(['Pechuga a la plancha con ensalada','Sopa de verduras con pollo','Ensalada de atún con tostadas','Quesadillas de pavo']);
        if (p.includes('O.A. moderado en grasa'))
          return rnd(['Quesadillas de queso','Tacos de frijoles con verduras','Sopa de fideos con carne']);
        return rnd(['Ensalada mixta','Consomé de pollo con verduras','Sopa de verduras']);
      },
    },
    {
      groups: ['Fruta'],
      nameFn: () => rnd(['Fruta de temporada','Fruta fresca']),
    },
    {
      groups: ['Leche descremada','Leche semidescremada','Leche entera'],
      nameFn: () => rnd(['Vaso de leche antes de dormir','Yogur nocturno']),
    },
  ],
};

function pickFood(groupNombre: string, equivalentes: number): Ingredient | null {
  const key = groupKeyMap[groupNombre];
  if (!key) return null;
  const options = foodDatabase[key];
  if (!options?.length) return null;
  const pick = rnd(options);
  return {
    id: uid(),
    nombre: pick.nombre,
    gramos: Math.round(pick.gramos * equivalentes),
    equivalente: Math.round(equivalentes * 10) / 10,
    unidad: pick.unidad,
  };
}

export function generateDiet(grupos: FoodGroup[], get: number): Meal[] {
  // If no equivalents set, use a default proportional diet
  const hasEquiv = grupos.some(g => g.equivalentes > 0);
  const workGrupos = hasEquiv ? grupos : buildDefaultGrupos(get, grupos);

  return MEAL_NAMES.map((mealNombre, mealIdx) => {
    const slots = PREP_SLOTS[mealNombre] || [];
    const preparaciones: Preparation[] = [];

    for (const slot of slots) {
      const ingredients: Ingredient[] = [];
      const presentGroups: string[] = [];

      for (const groupNombre of slot.groups) {
        const grupo = workGrupos.find(g => g.nombre === groupNombre);
        if (!grupo) continue;
        const dist = MEAL_DIST[groupNombre];
        if (!dist) continue;
        const eq = grupo.equivalentes * (dist[mealIdx] / 100);
        if (eq < 0.05) continue;

        const ing = pickFood(groupNombre, eq);
        if (ing) {
          ingredients.push(ing);
          presentGroups.push(groupNombre);
        }
      }

      if (ingredients.length === 0) continue;

      preparaciones.push({
        id: uid(),
        nombre: slot.nameFn(presentGroups),
        ingredientes: ingredients,
      });
    }

    return {
      id: mealNombre.toLowerCase().replace(/\s/g, '_'),
      nombre: mealNombre,
      icon: mealNombre,
      tip: '',
      preparaciones,
    };
  });
}

// Build a default reasonable diet when no equivalents are entered
function buildDefaultGrupos(get: number, template: FoodGroup[]): FoodGroup[] {
  // Roughly 60% HC, 15% Prot, 25% Lip
  const scale = get / 1800;
  const defaults: Record<string, number> = {
    'Verdura':                3 * scale,
    'Fruta':                  3 * scale,
    'Cereales y tubérculos':  6 * scale,
    'Leguminosas':            1 * scale,
    'O.A. bajo en grasa':     3 * scale,
    'O.A. moderado en grasa': 2 * scale,
    'Leche descremada':       1.5 * scale,
    'Grasa sin proteína':     3 * scale,
  };
  return template.map(g => ({
    ...g,
    equivalentes: Math.round((defaults[g.nombre] || 0) * 10) / 10,
  }));
}

export function calcEquivTable(grupos: FoodGroup[]) {
  return grupos
    .filter(g => g.equivalentes > 0)
    .map(g => {
      const dist = MEAL_DIST[g.nombre] || [0, 0, 0, 0, 0, 0];
      const perMeal = dist.map(pct => Math.round(g.equivalentes * pct / 100 * 10) / 10);
      const total = Math.round(perMeal.reduce((a, b) => a + b, 0) * 10) / 10;
      return { nombre: g.nombre, perMeal, total };
    });
}
