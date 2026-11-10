// Нормализация на български текст за търсене (без външни библиотеки)
const STOP = new Set(['на', 'за', 'и', 'в', 'във', 'с', 'със', 'от', 'до', 'по', 'се', 'си', 'е', 'са', 'ли', 'да', 'не', 'ще', 'то', 'та', 'ми', 'му', 'го', 'я', 'ги', 'им', 'аз', 'ти', 'той', 'тя', 'ние', 'вие', 'те', 'как', 'какво', 'кога', 'защо', 'къде', 'колко', 'кое', 'коя', 'кои', 'който', 'която', 'което', 'ако', 'но', 'или', 'а', 'че', 'при', 'след', 'преди', 'много', 'малко', 'мога', 'може', 'можe', 'трябва', 'нещо', 'някакво', 'моето', 'моят', 'моя', 'мой', 'мое', 'нашето', 'кучето', 'куче', 'кучета', 'кученце', 'кученцето', 'пес', 'песа', 'днес', 'вчера', 'сега', 'едно', 'един', 'една', 'има', 'няма', 'бе', 'беше', 'съм', 'сме', 'вече', 'още', 'само', 'какъв', 'каква', 'какви', 'дали', 'това', 'този', 'тази', 'тези']);

export function norm(s) {
  return String(s || '').toLowerCase()
    .replace(/[„“"'’`.,!?;:()\[\]{}\/\\\-–—_+*#%№]/g, ' ')
    .replace(/ѝ/g, 'и')
    .replace(/\s+/g, ' ').trim();
}

export function tokens(s, keepStop = false) {
  return norm(s).split(' ').filter((t) => t && (keepStop || !STOP.has(t)));
}

// Груб „стем“: премахва чести окончания; за сравнение ползваме и общ префикс
const SUFFIXES = ['ията', 'ието', 'ите', 'ата', 'ото', 'ият', 'ия', 'ът', 'та', 'то', 'те', 'ове', 'еве', 'ища', 'ки', 'ци', 'ни', 'ли', 'и', 'а', 'о', 'е', 'я', 'ъ', 'у'];
export function stem(t) {
  if (t.length <= 4) return t;
  for (const s of SUFFIXES) if (t.endsWith(s) && t.length - s.length >= 4) return t.slice(0, -s.length);
  return t;
}

// Съвпадат ли две думи (точно, по стем или по общ префикс ≥ 5 букви)
export function wordMatch(a, b) {
  if (a === b) return 2;
  const sa = stem(a), sb = stem(b);
  if (sa === sb) return 1.6;
  const min = Math.min(a.length, b.length);
  if (min >= 5) {
    let i = 0; while (i < min && a[i] === b[i]) i++;
    if (i >= 5 || (i >= 4 && i >= min - 1)) return 1.2;
  }
  return 0;
}

// Колко добре фразата (напр. синоним) се съдържа в токените на въпроса
export function phraseScore(phraseTokens, qTokens) {
  if (!phraseTokens.length) return 0;
  let total = 0;
  for (const p of phraseTokens) {
    let best = 0;
    for (const q of qTokens) best = Math.max(best, wordMatch(p, q), q.length >= 3 && p.startsWith(q) ? 1 : 0); // начало на дума – за подсказки докато пишете
    if (!best) return 0; // всички думи от фразата трябва да присъстват
    total += best;
  }
  return total / phraseTokens.length * (1 + 0.6 * (phraseTokens.length - 1));
}
