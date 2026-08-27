import type { Patient, MetodoCalculo, MacroDistribution, FoodGroup } from '../types';

// Genera opciones 0–60 igual que el sistema original:
// factor = 1 + valor/100  →  0=1.00, 10=1.10, 20=1.20 … 60=1.60
const _actCats = (i: number) => {
  if (i <=  9) return 'en cama';
  if (i <= 19) return 'sedentaria';
  if (i <= 29) return 'moderada';
  if (i <= 39) return 'intensa';
  if (i <= 49) return 'muy intensa';
  return 'deportista';
};

export const activityLevels = Array.from({ length: 61 }, (_, i) => ({
  value:  i,
  label:  `${i} (${_actCats(i)})`,
  factor: Math.round((1 + i / 100) * 1000) / 1000,
}));


export function calcularGET(
  patient: Patient,
  metodo: MetodoCalculo,
  factorActividad: number,
  gramosKilo?: number,
  caloriasKilo?: number
): number {
  const { edad, sexo, pesoActual, talla } = patient;
  let tmb = 0;

  switch (metodo) {
    case 'harris-benedict':
      if (sexo === 'M') {
        tmb = 88.362 + 13.397 * pesoActual + 4.799 * talla - 5.677 * edad;
      } else {
        tmb = 447.593 + 9.247 * pesoActual + 3.098 * talla - 4.33 * edad;
      }
      return Math.round(tmb * factorActividad);

    case 'fao-oms-onu':
      if (sexo === 'M') {
        if (edad < 30) tmb = 15.3 * pesoActual + 679;
        else if (edad < 60) tmb = 11.6 * pesoActual + 879;
        else tmb = 13.5 * pesoActual + 487;
      } else {
        if (edad < 30) tmb = 14.7 * pesoActual + 496;
        else if (edad < 60) tmb = 8.7 * pesoActual + 829;
        else tmb = 10.5 * pesoActual + 596;
      }
      return Math.round(tmb * factorActividad);

    case 'valencia':
      if (sexo === 'M') {
        tmb = 10 * pesoActual + 6.25 * talla - 5 * edad + 5;
      } else {
        tmb = 10 * pesoActual + 6.25 * talla - 5 * edad - 161;
      }
      return Math.round(tmb * factorActividad);

    case 'mifflin-st-jeor':
      if (sexo === 'M') {
        tmb = 10 * pesoActual + 6.25 * talla - 5 * edad + 5;
      } else {
        tmb = 10 * pesoActual + 6.25 * talla - 5 * edad - 161;
      }
      return Math.round(tmb * factorActividad);

    case 'gramos-por-kilo':
      return Math.round((gramosKilo || 0) * pesoActual * 4);

    case 'calorias-por-kilo':
      return Math.round((caloriasKilo || 0) * pesoActual);

    default:
      return 0;
  }
}

export function generarEquivalentesAuto(
  get: number,
  macros: MacroDistribution,
  grupos: FoodGroup[]
): FoodGroup[] {
  const grHC   = Math.round((get * macros.hdec / 100) / 4);
  const grProt = Math.round((get * macros.prot / 100) / 4);
  const grLip  = Math.round((get * macros.lip  / 100) / 9);

  const half = (n: number) => Math.round(n * 2) / 2;
  const scale = get / 1800;

  // Porciones base fijas (escaladas al GET)
  const verdura     = Math.max(1,   half(3   * scale));
  const fruta       = Math.max(1,   half(3   * scale));
  const leche       = Math.max(0.5, half(1.5 * scale));
  const leguminosas = Math.max(0.5, half(1   * scale));

  // Macros de grupos fijos
  const fixedHC   = verdura*4 + fruta*15 + leche*12 + leguminosas*20;
  const fixedProt = verdura*2 + leche*8  + leguminosas*7;

  // Evalúa el error total con una cantidad dada de cereales
  const errorCon = (cer: number) => {
    const oa = Math.max(0, Math.round(Math.max(0, grProt - fixedProt - cer*2) / 7));
    const gr = Math.max(0, Math.round(Math.max(0, grLip  - oa*3) / 5));
    return (
      Math.abs(grHC   - (fixedHC + cer*15)) +
      Math.abs(grProt - (fixedProt + cer*2 + oa*7)) +
      Math.abs(grLip  - (oa*3 + gr*5))
    );
  };

  // 1. Cereales: elegir entre redondeo entero y medio para minimizar error total
  const cerR = Math.max(0, Math.round((grHC - fixedHC) / 15));
  const cerH = Math.max(0, half((grHC - fixedHC) / 15));
  let cereales = errorCon(cerR) <= errorCon(cerH) ? cerR : cerH;

  // 2. OA bajo en grasa para proteína restante (ya contando cereales)
  let oaBajo = Math.max(0, Math.round(Math.max(0, grProt - fixedProt - cereales*2) / 7));

  // 3. Grasas para lípidos restantes (OA bajo aporta 3g lip cada uno)
  let grasas = Math.max(0, Math.round(Math.max(0, grLip - oaBajo*3) / 5));

  // Funciones de totales actuales
  const hcTotal   = () => fixedHC + cereales*15;
  const protTotal = () => fixedProt + cereales*2 + oaBajo*7;
  const lipTotal  = () => oaBajo*3 + grasas*5;

  // Ajuste fino HC: cada 0.5 cereal = 7.5g HC
  for (let i = 0; i < 20; i++) {
    const d = grHC - hcTotal();
    if      (d >=  8) { cereales += 0.5; }
    else if (d <= -8) { cereales = Math.max(0, cereales - 0.5); }
    else break;
  }

  // Recalcular tras ajuste de cereales
  oaBajo = Math.max(0, Math.round(Math.max(0, grProt - fixedProt - cereales*2) / 7));
  grasas = Math.max(0, Math.round(Math.max(0, grLip - oaBajo*3) / 5));

  // Ajuste fino proteína: cada 0.5 OA = 3.5g prot
  for (let i = 0; i < 20; i++) {
    const d = grProt - protTotal();
    if      (d >=  4) { oaBajo += 0.5; }
    else if (d <= -4) { oaBajo = Math.max(0, oaBajo - 0.5); }
    else break;
  }

  // Recalcular grasas tras ajuste de oaBajo
  grasas = Math.max(0, Math.round(Math.max(0, grLip - oaBajo*3) / 5));

  // Ajuste fino lípidos: cada 0.5 grasa = 2.5g lip
  for (let i = 0; i < 20; i++) {
    const d = grLip - lipTotal();
    if      (d >=  3) { grasas += 0.5; }
    else if (d <= -3) { grasas = Math.max(0, grasas - 0.5); }
    else break;
  }

  const asign: Record<string, number> = {
    'Verdura':                verdura,
    'Fruta':                  fruta,
    'Cereales y tubérculos':  cereales,
    'Cereales con grasa':     0,
    'Leguminosas':            leguminosas,
    'O.A. muy bajo en grasa': 0,
    'O.A. bajo en grasa':     oaBajo,
    'O.A. moderado en grasa': 0,
    'O.A. alto en grasa':     0,
    'Leche descremada':       leche,
    'Leche semidescremada':   0,
    'Leche entera':           0,
    'Azúcar sin grasa':       0,
    'Azúcar con grasa':       0,
    'Grasa sin proteína':     grasas,
    'Grasa con proteína':     0,
    'Suplemento de proteínas':0,
  };

  return grupos.map(g => ({ ...g, equivalentes: asign[g.nombre] ?? 0 }));
}

export function calcularPesoIdeal(talla: number, sexo: 'M' | 'F'): number {
  // Fórmula de Lorentz
  if (sexo === 'M') {
    return Math.round((talla - 100 - (talla - 150) / 4) * 10) / 10;
  } else {
    return Math.round((talla - 100 - (talla - 150) / 2) * 10) / 10;
  }
}

export function calcularIMC(peso: number, talla: number): number {
  const tallaM = talla / 100;
  return peso / (tallaM * tallaM);
}

export function clasificarIMC(imc: number): string {
  if (imc < 18.5) return 'Bajo peso';
  if (imc < 25) return 'Normal';
  if (imc < 30) return 'Sobrepeso';
  if (imc < 35) return 'Obesidad I';
  if (imc < 40) return 'Obesidad II';
  return 'Obesidad III';
}
