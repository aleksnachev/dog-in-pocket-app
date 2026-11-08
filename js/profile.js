// Извличане на персонализационни данни от профила на кучето
import { BREEDS, SIZE_CLASSES, adultSize, flagsFor } from '../data/breeds.js';
import { parseISO } from './util.js';

export const ALLERGENS = {
  chicken: 'пилешко', beef: 'говеждо/телешко', pork: 'свинско', lamb: 'агнешко', fish: 'риба', egg: 'яйца', dairy: 'млечни продукти', wheat: 'пшеница', soy: 'соя',
};

export const CONDITIONS = {
  overweight: 'Наднормено тегло (по преценка на ветеринар)',
  pancreatitis: 'Прекаран панкреатит',
  sensitive_stomach: 'Чувствителен стомах / хронично храносмилателно заболяване',
  food_allergy: 'Потвърдена хранителна алергия',
  kidney: 'Бъбречно заболяване',
  liver: 'Чернодробно заболяване',
  diabetes: 'Диабет',
  heart: 'Сърдечно заболяване',
  epilepsy: 'Епилепсия / гърчове',
  vet_diet: 'Специална диета, предписана от ветеринар',
  other: 'Друго установено заболяване',
};
// При тези състояния не даваме общи хранителни препоръки, а насочваме към ветеринаря
export const SERIOUS = ['kidney', 'liver', 'diabetes', 'heart', 'vet_diet', 'pancreatitis'];

export const ACTIVITY = {
  low: { label: 'Спокойно', hint: 'под 1 час движение на ден, разходки на повод', factor: 95 },
  moderate: { label: 'Умерено', hint: '1–3 часа на ден, спокойни игри', factor: 110 },
  high: { label: 'Активно', hint: '1–3 часа на ден с тичане, скачане, активни игри', factor: 125 },
  working: { label: 'Работно / спортно', hint: '3–6 часа на ден (пастирско, ловно, спорт)', factor: 150, factorMax: 175 },
};

export const FOOD_TYPES = { dry: 'Суха храна (гранули)', wet: 'Мокра храна', mixed: 'Суха + мокра', home: 'Домашно приготвена', raw: 'Сурова (BARF)', vet: 'Ветеринарна диета' };

export const INTERESTS = {
  pulling: 'Дърпа на повода', alone: 'Не обича да остава само', fireworks: 'Страх от фойерверки/шум', car: 'Пътуване с кола', weight: 'Тегло и хранене', puppy: 'Отглеждане на кученце', senior: 'Грижа за възрастно куче', travel: 'Пътуване в чужбина',
};

export function ageMonths(dog, at = new Date()) {
  const b = parseISO(dog.birthDate);
  if (!b) return null;
  let m = (at.getFullYear() - b.getFullYear()) * 12 + (at.getMonth() - b.getMonth());
  if (at.getDate() < b.getDate()) m -= 1;
  return Math.max(0, m);
}

export function ageWeeks(dog, at = new Date()) {
  const b = parseISO(dog.birthDate);
  if (!b) return null;
  return Math.floor((at - b) / (7 * 86400000));
}

export function ageLabel(dog) {
  const m = ageMonths(dog);
  if (m == null) return 'възраст не е въведена';
  if (m < 1) return `${ageWeeks(dog)} седм.`;
  if (m < 24) return `${m} мес.`;
  const y = Math.floor(m / 12), r = m % 12;
  return r ? `${y} г. и ${r} мес.` : `${y} г.`;
}

// Жизнен етап: кученце < 12 мес. (FEDIAF – растеж до 1 г.); в напреднала възраст > 7 г. (FEDIAF табл. VII-6)
export function lifeStage(dog) {
  const m = ageMonths(dog);
  if (m == null) return 'adult';
  if (m < 12) return 'puppy';
  if (m >= 84) return 'senior';
  return 'adult';
}
export const STAGE_LABEL = { puppy: 'кученце', adult: 'възрастно куче', senior: 'в напреднала възраст' };

export function breedOf(dog) { return BREEDS.find((b) => b.id === dog.breedId) || null; }

export function expectedAdultWeight(dog) {
  if (dog.expectedAdultWeight) return Number(dog.expectedAdultWeight);
  const s = adultSize(dog);
  return s ? SIZE_CLASSES[s].mid : null;
}

// Всички флагове за персонализация
export function profileFlags(dog) {
  const f = flagsFor(dog);
  const stage = lifeStage(dog);
  f.add(stage);
  if (dog.sex === 'f' && dog.neutered !== 'yes') f.add('female_intact');
  if (dog.neutered === 'yes') f.add('neutered');
  if ((dog.bcs && dog.bcs >= 6) || (dog.conditions || []).includes('overweight')) f.add('overweight');
  (dog.conditions || []).forEach((c) => f.add('cond:' + c));
  (dog.allergies || []).forEach((a) => f.add('allergy:' + a));
  if ((dog.conditions || []).some((c) => SERIOUS.includes(c)) || dog.foodType === 'vet') f.add('serious');
  if (dog.repro === 'pregnant' || dog.repro === 'lactating') f.add('repro');
  const size = adultSize(dog);
  if (size) f.add('size:' + size);
  return f;
}

export function dogSummary(dog) {
  const b = breedOf(dog);
  const parts = [b ? b.name : (dog.breedText || 'смесена порода / неизвестна')];
  parts.push(ageLabel(dog));
  if (dog.weight) parts.push(`${String(dog.weight).replace('.', ',')} кг`);
  return parts.join(' · ');
}

// Кратко текстово описание за AI сървъра (без име и лични данни)
export function profileForAI(dog) {
  const f = profileFlags(dog);
  return {
    stage: lifeStage(dog), ageMonths: ageMonths(dog), weightKg: dog.weight || null, bcs: dog.bcs || null,
    sex: dog.sex, neutered: dog.neutered, breed: breedOf(dog)?.name || null, adultSize: adultSize(dog),
    activity: dog.activity, foodType: dog.foodType, allergies: dog.allergies || [], conditions: dog.conditions || [],
    flags: [...f].filter((x) => !x.startsWith('cond:') && !x.startsWith('allergy:')),
  };
}
