import type { FoodGroup } from '../types';

export const gruposBase: Omit<FoodGroup, 'equivalentes'>[] = [
  { nombre: 'Verdura',                hdecPorEq: 4,  protPorEq: 2, lipPorEq: 0, calPorEq: 25  },
  { nombre: 'Fruta',                  hdecPorEq: 15, protPorEq: 0, lipPorEq: 0, calPorEq: 60  },
  { nombre: 'Cereales y tubérculos',  hdecPorEq: 15, protPorEq: 2, lipPorEq: 0, calPorEq: 70  },
  { nombre: 'Cereales con grasa',     hdecPorEq: 15, protPorEq: 2, lipPorEq: 5, calPorEq: 115 },
  { nombre: 'Leguminosas',            hdecPorEq: 20, protPorEq: 7, lipPorEq: 0, calPorEq: 110 },
  { nombre: 'O.A. muy bajo en grasa', hdecPorEq: 0,  protPorEq: 7, lipPorEq: 0, calPorEq: 35  },
  { nombre: 'O.A. bajo en grasa',     hdecPorEq: 0,  protPorEq: 7, lipPorEq: 3, calPorEq: 55  },
  { nombre: 'O.A. moderado en grasa', hdecPorEq: 0,  protPorEq: 7, lipPorEq: 5, calPorEq: 75  },
  { nombre: 'O.A. alto en grasa',     hdecPorEq: 0,  protPorEq: 7, lipPorEq: 8, calPorEq: 100 },
  { nombre: 'Leche descremada',        hdecPorEq: 12, protPorEq: 8, lipPorEq: 0, calPorEq: 90  },
  { nombre: 'Leche semidescremada',    hdecPorEq: 12, protPorEq: 8, lipPorEq: 2.5, calPorEq: 110 },
  { nombre: 'Leche entera',            hdecPorEq: 12, protPorEq: 8, lipPorEq: 5, calPorEq: 150 },
  { nombre: 'Grasa sin proteína',      hdecPorEq: 0,  protPorEq: 0, lipPorEq: 5, calPorEq: 45  },
  { nombre: 'Grasa con proteína',      hdecPorEq: 0,  protPorEq: 2, lipPorEq: 5, calPorEq: 55  },
  { nombre: 'Azúcar sin grasa',        hdecPorEq: 15, protPorEq: 0, lipPorEq: 0, calPorEq: 60  },
  { nombre: 'Azúcar con grasa',        hdecPorEq: 15, protPorEq: 0, lipPorEq: 5, calPorEq: 105 },
];

export function initGrupos(): FoodGroup[] {
  return gruposBase.map(g => ({ ...g, equivalentes: 0 }));
}
