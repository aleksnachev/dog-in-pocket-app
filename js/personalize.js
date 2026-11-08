// Правила за персонализация: как профилът на кучето променя отговора.
import { ALLERGENS, profileFlags } from './profile.js';
import { energyPlan, fmt } from './calc.js';
import { BREEDS } from '../data/breeds.js';

export const VERDICT = {
  ok: { rank: 0, label: 'Може – в малко количество', short: 'Може', cls: 'v-ok' },
  care: { rank: 1, label: 'С повишено внимание', short: 'Внимание', cls: 'v-care' },
  no: { rank: 2, label: 'Не давайте', short: 'Не', cls: 'v-no' },
  danger: { rank: 3, label: 'Опасно – свържете се с ветеринар', short: 'Опасно', cls: 'v-danger' },
};
const up = (a, b) => (VERDICT[b].rank > VERDICT[a].rank ? b : a);

const has = (dog, list, x) => (dog[list] || []).includes(x);

// Храна → присъда за ТОВА куче + обяснение какво от профила е повлияло
export function foodFor(food, dog) {
  let v = food.verdict;
  const why = [];
  if (!dog) return { verdict: v, why };
  const f = profileFlags(dog);
  const tags = food.tags || [];
  tags.filter((t) => t.startsWith('allergen:')).forEach((t) => {
    const a = t.split(':')[1];
    if (has(dog, 'allergies', a)) { v = up(v, 'no'); why.push(`В профила е отбелязана алергия/непоносимост към ${ALLERGENS[a]}.`); }
  });
  if (tags.includes('fat')) {
    if (has(dog, 'conditions', 'pancreatitis')) { v = up(v, 'no'); why.push('Мазно е – при прекаран панкреатит мазните храни са рискови (PDSA).'); }
    else if (f.has('overweight')) { v = up(v, 'care'); why.push('Калорично/мазно – кучето е с наднормено тегло.'); }
    else if (BREEDS.find((b) => b.id === dog.breedId)?.flags.includes('pancreatitis')) { why.push('Породата по-често развива панкреатит (PDSA) – бъдете пестеливи с мазното.'); v = up(v, 'care'); }
  }
  if (tags.includes('lactose') && (has(dog, 'conditions', 'sensitive_stomach'))) { v = up(v, 'care'); why.push('Съдържа лактоза – при чувствителен стомах често причинява диария.'); }
  if (tags.includes('sugar')) {
    if (has(dog, 'conditions', 'diabetes')) { v = up(v, 'no'); why.push('Съдържа захар – при диабет питайте ветеринаря.'); }
    else if (f.has('overweight') && v === 'ok') { why.push('Има захар – при наднормено тегло давайте съвсем малко.'); }
  }
  if (tags.includes('salt') && (has(dog, 'conditions', 'heart') || has(dog, 'conditions', 'kidney'))) { v = up(v, 'no'); why.push('Солено – при сърдечно или бъбречно заболяване солта се ограничава.'); }
  if (tags.includes('gas') && f.has('gdv')) { v = up(v, 'care'); why.push('Причинява газове – при породи/размер с риск от подуване на стомаха питайте ветеринаря (AKC).'); }
  if (tags.includes('choke_small') && f.has('size:toy')) why.push('Много малко куче – нарежете или смачкайте, за да не се задави.');
  if (f.has('serious') && v !== 'danger') why.push('Кучето има заболяване/специална диета в профила – преди нова храна попитайте ветеринаря.');
  if (f.has('puppy') && v === 'ok') why.push('Кученце: новите храни – в съвсем малки количества.');
  return { verdict: v, why };
}

// Рецепта → дали е подходяща за ТОВА куче
export function recipeFor(r, dog) {
  const res = { status: 'ok', reasons: [], portion: null };
  if (!dog) return res;
  const f = profileFlags(dog);
  const tags = r.tags || [];
  if (f.has('serious') && !r.safeForDiet) {
    res.status = 'hidden';
    res.reasons.push('Кучето има заболяване или специална диета – домашни лакомства само след одобрение от ветеринаря.');
  }
  tags.filter((t) => t.startsWith('allergen:')).forEach((t) => {
    const a = t.split(':')[1];
    if (has(dog, 'allergies', a)) { res.status = 'hidden'; res.reasons.push(`Съдържа ${ALLERGENS[a]} (алергия в профила).`); }
  });
  if (tags.includes('fat')) {
    if (has(dog, 'conditions', 'pancreatitis')) { res.status = 'hidden'; res.reasons.push('Съдържа много мазнина – неподходящо след панкреатит.'); }
    else if (f.has('overweight')) { if (res.status === 'ok') res.status = 'warn'; res.reasons.push('Калорично (мазнини) – при наднормено тегло изберете по-леко лакомство.'); }
  }
  if (tags.includes('sugar') && has(dog, 'conditions', 'diabetes')) { res.status = 'hidden'; res.reasons.push('Съдържа захар/сладки плодове – при диабет само по съвет на ветеринар.'); }
  if (tags.includes('lactose') && has(dog, 'conditions', 'sensitive_stomach')) { if (res.status === 'ok') res.status = 'warn'; res.reasons.push('Кисело мляко/лактоза – при чувствителен стомах може да разстрои.'); }
  // Порция
  const plan = energyPlan(dog);
  if (r.portion?.split && dog.weight) {
    res.portion = (Number(dog.weight) < r.portion.split ? r.portion.small : r.portion.large) + (r.portion.note ? ' ' + r.portion.note : '');
  } else if (r.portion?.text) res.portion = r.portion.text;
  if (plan.ok) res.treatKcal = Math.round(plan.treatKcal);
  return res;
}

// Приоритет на SOS/статии според профила
export function profileBoost(item, dog) {
  if (!dog || !item.profile && !item.show) return 0;
  const f = profileFlags(dog);
  const list = item.profile || item.show || [];
  return list.some((x) => f.has(x)) ? 1 : 0;
}

export function treatLine(dog) {
  const p = energyPlan(dog);
  if (!p.ok) return null;
  return `Лимит лакомства за ${dog.name || 'кучето'}: до ~${fmt(p.treatKcal, 0)} ккал на ден (10% от ${fmt(p.kcal, 0)} ккал).`;
}
