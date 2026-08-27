export interface FoodItem {
  nombre: string;
  gramos: number;
  equivalente: number;
  unidad: string;
}

export type FoodGroupKey =
  | 'verdura' | 'fruta' | 'cereales' | 'cerealesGrasa'
  | 'leguminosas' | 'oaMuyBajo' | 'oaBajo' | 'oaModerado' | 'oaAlto'
  | 'lecheDesc' | 'lecheSemi' | 'lecheEntera'
  | 'grasaSin' | 'grasaCon' | 'azucarSin' | 'azucarCon';

export const foodDatabase: Record<FoodGroupKey, FoodItem[]> = {
  verdura: [
    { nombre: 'Jitomate', gramos: 120, equivalente: 1, unidad: 'pieza' },
    { nombre: 'Zanahoria', gramos: 83, equivalente: 1, unidad: 'pieza' },
    { nombre: 'Lechuga', gramos: 90, equivalente: 1, unidad: 'taza' },
    { nombre: 'Brócoli', gramos: 80, equivalente: 1, unidad: 'taza' },
    { nombre: 'Espinaca', gramos: 90, equivalente: 1, unidad: 'taza' },
    { nombre: 'Pepino', gramos: 120, equivalente: 1, unidad: 'pieza' },
    { nombre: 'Nopal', gramos: 120, equivalente: 1, unidad: 'taza' },
    { nombre: 'Chayote', gramos: 120, equivalente: 1, unidad: 'pieza' },
    { nombre: 'Calabaza', gramos: 100, equivalente: 1, unidad: 'taza' },
    { nombre: 'Chile poblano', gramos: 80, equivalente: 1, unidad: 'pieza' },
  ],
  fruta: [
    { nombre: 'Manzana', gramos: 90, equivalente: 1, unidad: 'pieza' },
    { nombre: 'Naranja', gramos: 70, equivalente: 1, unidad: 'pieza' },
    { nombre: 'Papaya', gramos: 140, equivalente: 1, unidad: 'taza' },
    { nombre: 'Plátano', gramos: 50, equivalente: 1, unidad: 'pieza chica' },
    { nombre: 'Sandía', gramos: 160, equivalente: 1, unidad: 'taza' },
    { nombre: 'Mango', gramos: 70, equivalente: 1, unidad: '½ pieza' },
    { nombre: 'Pera', gramos: 90, equivalente: 1, unidad: 'pieza' },
    { nombre: 'Fresas', gramos: 140, equivalente: 1, unidad: 'taza' },
    { nombre: 'Melón', gramos: 150, equivalente: 1, unidad: 'taza' },
    { nombre: 'Guayaba', gramos: 80, equivalente: 1, unidad: 'pieza' },
  ],
  cereales: [
    { nombre: 'Tortilla de maíz', gramos: 30, equivalente: 1, unidad: 'pieza' },
    { nombre: 'Pan integral', gramos: 25, equivalente: 1, unidad: 'rebanada' },
    { nombre: 'Arroz cocido', gramos: 70, equivalente: 1, unidad: '⅓ taza' },
    { nombre: 'Papa cocida', gramos: 90, equivalente: 1, unidad: 'pieza chica' },
    { nombre: 'Avena cocida', gramos: 120, equivalente: 1, unidad: '½ taza' },
    { nombre: 'Pasta cocida', gramos: 70, equivalente: 1, unidad: '½ taza' },
    { nombre: 'Camote cocido', gramos: 90, equivalente: 1, unidad: 'pieza chica' },
    { nombre: 'Tostada horneada', gramos: 20, equivalente: 1, unidad: 'pieza' },
  ],
  cerealesGrasa: [
    { nombre: 'Granola', gramos: 30, equivalente: 1, unidad: '¼ taza' },
    { nombre: 'Pan dulce', gramos: 35, equivalente: 1, unidad: 'pieza chica' },
    { nombre: 'Galletas integrales c/grasa', gramos: 30, equivalente: 1, unidad: '4 piezas' },
    { nombre: 'Tortilla de harina', gramos: 35, equivalente: 1, unidad: 'pieza' },
    { nombre: 'Waffle integral', gramos: 35, equivalente: 1, unidad: 'pieza' },
  ],
  leguminosas: [
    { nombre: 'Frijoles cocidos', gramos: 90, equivalente: 1, unidad: '½ taza' },
    { nombre: 'Lentejas cocidas', gramos: 90, equivalente: 1, unidad: '½ taza' },
    { nombre: 'Garbanzos cocidos', gramos: 90, equivalente: 1, unidad: '½ taza' },
    { nombre: 'Habas cocidas', gramos: 90, equivalente: 1, unidad: '½ taza' },
    { nombre: 'Soya cocida', gramos: 90, equivalente: 1, unidad: '½ taza' },
  ],
  oaMuyBajo: [
    { nombre: 'Pechuga de pollo', gramos: 30, equivalente: 1, unidad: 'onza' },
    { nombre: 'Atún en agua', gramos: 30, equivalente: 1, unidad: 'onza' },
    { nombre: 'Clara de huevo', gramos: 45, equivalente: 1, unidad: '1½ piezas' },
    { nombre: 'Pavo cocido', gramos: 30, equivalente: 1, unidad: 'onza' },
    { nombre: 'Tilapia', gramos: 30, equivalente: 1, unidad: 'onza' },
  ],
  oaBajo: [
    { nombre: 'Pollo muslo sin piel', gramos: 30, equivalente: 1, unidad: 'onza' },
    { nombre: 'Pescado blanco', gramos: 30, equivalente: 1, unidad: 'onza' },
    { nombre: 'Jamón de pavo', gramos: 30, equivalente: 1, unidad: 'onza' },
    { nombre: 'Sardina en agua', gramos: 30, equivalente: 1, unidad: 'onza' },
    { nombre: 'Queso panela', gramos: 30, equivalente: 1, unidad: 'onza' },
  ],
  oaModerado: [
    { nombre: 'Huevo entero', gramos: 55, equivalente: 1, unidad: 'pieza' },
    { nombre: 'Carne molida magra', gramos: 30, equivalente: 1, unidad: 'onza' },
    { nombre: 'Res magra', gramos: 30, equivalente: 1, unidad: 'onza' },
    { nombre: 'Queso Oaxaca', gramos: 30, equivalente: 1, unidad: 'onza' },
    { nombre: 'Salmón', gramos: 30, equivalente: 1, unidad: 'onza' },
  ],
  oaAlto: [
    { nombre: 'Chorizo', gramos: 30, equivalente: 1, unidad: 'onza' },
    { nombre: 'Salchicha', gramos: 45, equivalente: 1, unidad: 'pieza' },
    { nombre: 'Queso manchego', gramos: 30, equivalente: 1, unidad: 'onza' },
    { nombre: 'Chicharrón', gramos: 30, equivalente: 1, unidad: 'onza' },
  ],
  lecheDesc: [
    { nombre: 'Leche descremada', gramos: 240, equivalente: 1, unidad: 'taza' },
    { nombre: 'Yogur descremado natural', gramos: 175, equivalente: 1, unidad: '¾ taza' },
  ],
  lecheSemi: [
    { nombre: 'Leche semidescremada', gramos: 240, equivalente: 1, unidad: 'taza' },
    { nombre: 'Yogur light', gramos: 175, equivalente: 1, unidad: '¾ taza' },
  ],
  lecheEntera: [
    { nombre: 'Leche entera', gramos: 240, equivalente: 1, unidad: 'taza' },
    { nombre: 'Yogur entero natural', gramos: 175, equivalente: 1, unidad: '¾ taza' },
  ],
  grasaSin: [
    { nombre: 'Aceite de oliva', gramos: 5, equivalente: 1, unidad: 'cucharadita' },
    { nombre: 'Aguacate', gramos: 30, equivalente: 1, unidad: '⅛ pieza' },
    { nombre: 'Aceite de canola', gramos: 5, equivalente: 1, unidad: 'cucharadita' },
    { nombre: 'Nuez', gramos: 10, equivalente: 1, unidad: '4 piezas' },
    { nombre: 'Almendras', gramos: 10, equivalente: 1, unidad: '6 piezas' },
  ],
  grasaCon: [
    { nombre: 'Aguacate', gramos: 45, equivalente: 1, unidad: '⅙ pieza' },
    { nombre: 'Cacahuates', gramos: 15, equivalente: 1, unidad: '15 piezas' },
    { nombre: 'Ajonjolí', gramos: 15, equivalente: 1, unidad: 'cucharada' },
  ],
  azucarSin: [
    { nombre: 'Azúcar', gramos: 15, equivalente: 1, unidad: 'cucharada' },
    { nombre: 'Miel', gramos: 15, equivalente: 1, unidad: 'cucharada' },
    { nombre: 'Mermelada diet', gramos: 20, equivalente: 1, unidad: 'cucharada' },
  ],
  azucarCon: [
    { nombre: 'Chocolate oscuro', gramos: 20, equivalente: 1, unidad: 'porción' },
    { nombre: 'Cajeta', gramos: 20, equivalente: 1, unidad: 'cucharada' },
  ],
};

export const groupKeyMap: Record<string, FoodGroupKey> = {
  'Verdura':                'verdura',
  'Fruta':                  'fruta',
  'Cereales y tubérculos':  'cereales',
  'Cereales con grasa':     'cerealesGrasa',
  'Leguminosas':            'leguminosas',
  'O.A. muy bajo en grasa': 'oaMuyBajo',
  'O.A. bajo en grasa':     'oaBajo',
  'O.A. moderado en grasa': 'oaModerado',
  'O.A. alto en grasa':     'oaAlto',
  'Leche descremada':        'lecheDesc',
  'Leche semidescremada':    'lecheSemi',
  'Leche entera':            'lecheEntera',
  'Grasa sin proteína':      'grasaSin',
  'Grasa con proteína':      'grasaCon',
  'Azúcar sin grasa':        'azucarSin',
  'Azúcar con grasa':        'azucarCon',
};
