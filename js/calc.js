// Калкулатор за енергия – по FEDIAF Nutritional Guidelines 2025 (табл. VII-6, VII-7, VII-8a, VII-8b)
// и WSAVA (лакомства < 10% от дневните калории). Резултатът е ОРИЕНТИРОВЪЧНА начална стойност.
import { ACTIVITY, lifeStage, ageWeeks, ageMonths, expectedAdultWeight, breedOf, profileFlags } from './profile.js';
import { adultSize } from '../data/breeds.js';

const mw = (kg) => Math.pow(kg, 0.75);

// WSAVA „Calorie Ranges for an Average Healthy Adult Dog in Ideal Body Condition“ (2020) – кг: [мин, макс] ккал/ден
const WSAVA = {2:[140,177],3:[190,239],4:[240,297],5:[280,351],6:[320,403],7:[360,452],8:[400,499],9:[440,546],10:[470,590],11:[510,634],12:[540,677],13:[580,719],14:[610,760],15:[640,800],16:[670,840],17:[700,879],18:[730,918],19:[760,956],20:[790,993],21:[820,1030],22:[850,1067],23:[880,1103],24:[910,1139],25:[940,1174],26:[970,1209],27:[1000,1244],28:[1020,1278],29:[1050,1312],30:[1080,1346],31:[1100,1397],32:[1130,1413],33:[1160,1446],34:[1180,1478],35:[1210,1511],36:[1240,1543],37:[1260,1575],38:[1290,1607],39:[1310,1639],40:[1340,1670],41:[1360,1701],42:[1390,1732],43:[1410,1763],44:[1440,1794],45:[1460,1824],46:[1480,1855],47:[1510,1885],48:[1530,1915],49:[1560,1945]};
export function wsavaRange(kg) {
  if (kg < 2 || kg > 49) return null;
  const a = Math.floor(kg), b = Math.ceil(kg);
  if (a === b) return WSAVA[a];
  const t = kg - a; const A = WSAVA[a], B = WSAVA[b];
  return [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t];
}

// FEDIAF табл. VII-8a – очакван % от теглото на възрастното куче според възрастта (8 седм. – 1 г.)
export function expectedGrowthPct(adultKg, weeks) {
  if (!adultKg || !weeks || weeks < 8 || weeks > 52) return null;
  const ln = Math.log(weeks);
  let pct;
  if (adultKg <= 7) pct = 36.92 * ln - 43.57;
  else if (adultKg <= 15) pct = 36.86 * ln - 48.22;
  else if (adultKg <= 27.5) pct = 39.88 * ln - 60.70;
  else if (adultKg <= 47.5) pct = 36.96 * ln - 56.18;
  else pct = 36.61 * ln - 62.39;
  return Math.max(0, Math.min(100, pct));
}

export function energyPlan(dog) {
  const w = Number(dog.weight);
  const out = { ok: false, notes: [], refer: null, kcal: null, min: null, max: null, method: '', src: ['fediaf'] };
  if (!w || w <= 0) { out.refer = 'Въведете текущото тегло на кучето в профила.'; return out; }
  const flags = profileFlags(dog);

  if (flags.has('repro')) {
    out.refer = 'При бременност и кърмене нуждите се променят силно (и зависят от броя кученца). Изчислението трябва да направи ветеринар.';
    return out;
  }

  const stage = lifeStage(dog);
  if (stage === 'puppy') {
    const wk = ageWeeks(dog);
    if (wk != null && wk < 8) { out.refer = 'До 8-седмична възраст кученцето се храни от майката/по указание на развъдчика и ветеринаря.'; return out; }
    const adult = expectedAdultWeight(dog);
    if (!adult) { out.refer = 'Въведете очакваното тегло като възрастно (или размер/порода), за да изчислим нуждите на кученцето.'; return out; }
    const p = Math.min(1, w / adult);
    const kcal = (254.1 - 135.0 * p) * mw(w);
    out.ok = true; out.kcal = kcal;
    out.method = `Кученце: [254,1 − 135 × (${fmt(w)} / ${fmt(adult)} кг)] × ${fmt(w)}^0,75 (FEDIAF, табл. VII-8b)`;
    const pct = expectedGrowthPct(adult, wk);
    if (pct) {
      const exp = adult * pct / 100;
      out.growth = { expectedKg: exp, pct, adult };
      const dev = (w - exp) / exp;
      if (dev > 0.15) out.notes.push(`За тази възраст кривата на FEDIAF очаква около ${fmt(exp)} кг. Кученцето е над нея – прекаленото хранене ускорява растежа (рисково за костите при едрите породи). Обсъдете с ветеринаря.`);
      else if (dev < -0.15) out.notes.push(`За тази възраст кривата на FEDIAF очаква около ${fmt(exp)} кг. Кученцето е под нея – обсъдете с ветеринаря.`);
    }
    out.notes.push('Никога не оставяйте неограничено храна на кученце (FEDIAF). Теглете го редовно и коригирайте количеството.');
    return finish(out, dog, flags);
  }

  // Възрастни
  const act = ACTIVITY[dog.activity] || ACTIVITY.moderate;
  let factor = act.factor, fmax = act.factorMax || act.factor;
  const breed = breedOf(dog);
  if (breed?.energy) { factor = breed.energy; fmax = breed.energy; out.notes.push(breed.energyNote); }
  if (stage === 'senior' && (dog.activity === 'low' || !dog.activity)) {
    factor = 95; fmax = 95;
    out.notes.push('Над 7 години: FEDIAF дава средно 95 (80–120) ккал × кг^0,75; възрастни кучета, които още тичат и играят, имат нужда от повече.');
  }
  if (flags.has('overweight')) {
    out.notes.push('Кучето е отбелязано с наднормено тегло. За отслабване количеството се изчислява за ЦЕЛЕВОТО тегло – определете го с ветеринаря (FEDIAF: за склонни към напълняване възрастни ≤ 90 ккал × кг^0,75).');
    factor = Math.min(factor, 90); fmax = Math.min(fmax, 90);
  }
  if (flags.has('neutered')) out.notes.push('Кастрираните кучета обикновено имат нужда от по-малко калории – започнете от долната граница (PDSA).');
  const kcal = ((factor + fmax) / 2) * mw(w);
  out.ok = true; out.kcal = kcal;
  const band = wsavaRange(w);
  if (band && !flags.has('overweight') && !breed?.energy && dog.activity !== 'working') {
    out.min = band[0]; out.max = band[1];
    out.bandNote = 'Обхват на WSAVA за средно здраво възрастно куче с идеална кондиция и това тегло.';
    out.src.push('wsava_cal');
    if (kcal > band[1] && (dog.activity === 'low' || dog.activity === 'moderate' || !dog.activity)) {
      // FEDIAF: „може да е по-добре да се започне от по-ниска стойност и да се добавя при нужда“ – за да няма напълняване
      out.kcal = band[1];
      out.capped = Math.round(kcal);
    }
  }
  out.method = `Възрастно (${act.label.toLowerCase()}): ${factor === fmax ? factor : factor + '–' + fmax} ккал × ${fmt(w)}^0,75 (FEDIAF, табл. VII-7)`;
  if (out.capped) out.notes.push(`По таблицата на FEDIAF за тази активност се получават около ${out.capped} ккал, но това е над горната граница на WSAVA за това тегло. FEDIAF препоръчва да се започне от по-ниска стойност и да се добавя при нужда – затова началната стойност е ограничена до ${Math.round(out.kcal)} ккал.`);
  out.notes.push('FEDIAF: препоръките може да надценяват нуждите с 10–60% при домашни кучета – започнете оттук и следете теглото и формата (идеално 4–5/9) на всеки 2–4 седмици.');
  return finish(out, dog, flags);
}

function finish(out, dog, flags) {
  out.treatKcal = out.kcal * 0.10;
  out.src.push('wsava_treats');
  const kcalKg = Number(dog.foodKcalPerKg) || null;
  if (kcalKg) {
    out.gramsFull = out.kcal / kcalKg * 1000;
    out.gramsWithTreats = out.kcal * 0.9 / kcalKg * 1000;
  }
  if (dog.bcs && (dog.bcs <= 3 || dog.bcs >= 7)) out.notes.unshift(`Телесна кондиция ${dog.bcs}/9 – извън идеалното (4–5). Промяната на теглото трябва да е по план от ветеринар.`);
  if (flags.has('serious')) out.notes.unshift('Кучето има заболяване/специална диета в профила – количеството и вида храна определя ветеринарят. Числото по-долу е само за ориентир.');
  return out;
}

export const fmt = (n, d = 1) => Number(n).toLocaleString('bg-BG', { maximumFractionDigits: d });

// Ориентировъчен лимит лакомства в ккал за конкретно куче
export function treatAllowance(dog) {
  const p = energyPlan(dog);
  return p.ok ? p.treatKcal : null;
}
