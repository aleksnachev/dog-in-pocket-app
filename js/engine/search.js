// Локално търсене в проверената база: храни, SOS теми, статии, рецепти.
// Работи без интернет и без AI. Връща резултати, подредени по релевантност и по профила на кучето.
import { FOODS } from '../../data/foods.js';
import { SOS } from '../../data/sos.js';
import { ARTICLES } from '../../data/care.js';
import { RECIPES } from '../../data/recipes.js';
import { tokens, phraseScore, wordMatch, norm } from './text.js';
import { triage } from './triage.js';
import { profileBoost } from '../personalize.js';

let INDEX = null;
function build() {
  const docs = [];
  const add = (type, item, title, phrases, body) => docs.push({
    type, item, id: item.id,
    phrases: [...new Set([title, ...phrases])].map((p) => tokens(p)).filter((x) => x.length),
    body: tokens(body).slice(0, 80),
  });
  FOODS.forEach((f) => add('food', f, f.name, f.aliases, f.summary));
  SOS.forEach((s) => add('sos', s, s.title, s.aliases, [s.intro, ...(s.signs || [])].join(' ')));
  ARTICLES.forEach((a) => add('article', a, a.title, a.aliases, a.summary));
  RECIPES.forEach((r) => add('recipe', r, r.title, [], r.ingredients.join(' ')));
  INDEX = docs;
}

const FOOD_INTENT = /(яде|ям|ядат|хапне|хапва|дам|давам|дадем|храня|храни|може ли.*(да|за)|безопасн|вредн|отровн|опасн|позволен)/;
const ATE_INTENT = /(изяд|изял|глътн|погълн|излапа|нагълта|хапна|изпи)/;
const RECIPE_INTENT = /(рецеп|лакомств|бисквит|приготв|сготв|направ.*(лакомств|бисквит))/;
const HOWTO_INTENT = /(как|колко|кога|какво да|трябва ли|нормално ли)/;

export function search(query, dog, limit = 12) {
  if (!INDEX) build();
  const nq = norm(query);
  const all = tokens(query);
  // глаголите за хранене („яде“, „дам“…) определят намерението, но не трябва да съвпадат с теми като „Не яде“
  const VERBS = new Set(['яде', 'ям', 'ядат', 'хапне', 'дам', 'давам', 'дадем', 'даде', 'храня', 'ядe']);
  const q = all.filter((t) => !VERBS.has(t)).length ? all.filter((t) => !VERBS.has(t)) : all;
  const tri = triage(query);
  if (!q.length) return { results: [], triage: tri, q: nq };
  const isRecipeQ = RECIPE_INTENT.test(nq);
  const intents = { food: FOOD_INTENT.test(nq), ate: ATE_INTENT.test(nq), recipe: RECIPE_INTENT.test(nq), howto: HOWTO_INTENT.test(nq) };

  const scored = [];
  for (const d of INDEX) {
    let best = 0;
    for (const p of d.phrases) best = Math.max(best, phraseScore(p, q));
    let s = best * 10;
    // частични съвпадения в тялото
    let bodyHits = 0;
    for (const w of q) if (d.body.some((b) => wordMatch(w, b) >= 1.2)) bodyHits++;
    s += bodyHits * 1.2;
    if (!s) continue;
    if (d.type === 'food' && intents.food) s *= 1.5;
    if (d.type === 'sos' && intents.ate) s *= 1.3;
    if (d.type === 'food' && intents.ate && (d.item.verdict === 'danger')) s *= 1.4;
    if (d.type === 'recipe') s = intents.recipe ? s * 3 + 15 : s * 0.5;
    if (d.type === 'food' && intents.recipe) s *= 0.6;
    if (d.type === 'article' && intents.howto) s *= 1.2;
    if (tri.sos.includes(d.id) && d.type === 'sos') s += 40;
    s *= 1 + 0.25 * profileBoost(d.item, dog);
    scored.push({ type: d.type, item: d.item, score: s });
  }
  scored.sort((a, b) => b.score - a.score);
  // отрязваме много слабите резултати спрямо най-добрия
  const top = scored[0]?.score || 0;
  const results = scored.filter((r) => r.score >= Math.max(4, top * 0.25)).slice(0, limit);
  return { results, triage: tri, q: nq, intents };
}

// Пълнотекстов контекст за AI (само от проверената база)
export function contextFor(results, n = 6) {
  return results.slice(0, n).map((r) => {
    const it = r.item;
    if (r.type === 'food') return { id: 'food:' + it.id, title: it.name, verdict: it.verdict, text: [it.summary, ...(it.how || []), ...(it.warn || [])].join(' '), src: it.src };
    if (r.type === 'sos') return { id: 'sos:' + it.id, title: it.title, urgency: it.urgency, text: [it.intro, 'Признаци: ' + (it.signs || []).join('; '), 'Спешно ако: ' + (it.redFlags || []).join('; '), 'Какво да направите: ' + (it.doNow || []).join(' '), 'Не правете: ' + (it.dont || []).join(' '), it.vet || ''].join(' '), src: it.src };
    if (r.type === 'article') return { id: 'care:' + it.id, title: it.title, text: [it.summary, ...it.body.map((b) => [b.h, b.p, ...(b.list || [])].filter(Boolean).join(' '))].join(' '), src: it.src };
    return { id: 'recipe:' + it.id, title: it.title, text: it.ingredients.join(', '), src: [it.src] };
  });
}
