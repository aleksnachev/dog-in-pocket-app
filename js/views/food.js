import { esc, $ } from '../util.js';
import { icon } from '../icons.js';
import { store } from '../store.js';
import { FOODS, FOOD_CATS } from '../../data/foods.js';
import { RECIPES } from '../../data/recipes.js';
import { SOS } from '../../data/sos.js';
import { foodFor, recipeFor, VERDICT, treatLine } from '../personalize.js';
import { energyPlan, fmt } from '../calc.js';
import { ACTIVITY, FOOD_TYPES, profileFlags } from '../profile.js';
import { topbar, sourcesList, verdictPill, disclaimer, vetCallBar } from '../components.js';
import { tokens, phraseScore } from '../engine/text.js';

const tabs = (on) => `<nav class="seg" style="margin:4px 0 12px">${[['search', 'Може ли да яде?'], ['kitchen', 'Кучешка кухня'], ['calc', 'Калкулатор']].map(([k, l]) => `<a href="#/food/${k}" class="${on === k ? 'on' : ''}">${l}</a>`).join('')}</nav>`;

export function foodView(root, params, sub = 'search') {
  const dog = store.activeDog();
  if (sub === 'kitchen') return kitchen(root, dog);
  if (sub === 'calc') return calcView(root, dog);
  return foodSearch(root, dog, params);
}

function foodSearch(root, dog, params) {
  const st = { q: params.get('q') || '', cat: params.get('cat') || '' };
  function list() {
    let items = FOODS.map((f) => ({ f, p: foodFor(f, dog) }));
    if (st.cat) items = items.filter((x) => x.f.cat === st.cat);
    const q = tokens(st.q);
    if (q.length) {
      items = items.map((x) => ({ ...x, s: Math.max(...[x.f.name, ...x.f.aliases].map((a) => phraseScore(q, tokens(a))), ...[x.f.name, ...x.f.aliases].map((a) => phraseScore(tokens(a), q))) }))
        .filter((x) => x.s > 0).sort((a, b) => b.s - a.s);
    } else items.sort((a, b) => VERDICT[b.p.verdict].rank - VERDICT[a.p.verdict].rank || a.f.name.localeCompare(b.f.name, 'bg'));
    if (!items.length) return `<div class="empty">Няма такава храна в базата.<br><span class="small">Не значи, че е безопасна – питайте ветеринар или опитайте друга дума.</span></div>`;
    return items.map(({ f, p }) => `<a class="item" href="#/food/item/${f.id}"><span class="dot ${VERDICT[p.verdict].cls}"></span><span class="grow"><span class="t">${esc(f.name)}</span><span class="s" style="display:block">${esc(VERDICT[p.verdict].label)}${p.verdict !== f.verdict ? ' · за ' + esc(dog.name) : ''}</span></span>${icon('chevron', 'chev')}</a>`).join('');
  }
  function render(keepFocus) {
    root.innerHTML = `${topbar('Хранене')}<div class="view">${tabs('search')}
      <div class="searchbar">${icon('search', 'sm')}<input id="fq" type="search" placeholder="Банан, сирене, грозде, кости…" value="${esc(st.q)}" autocomplete="off" aria-label="Търси храна"></div>
      <div class="chips" style="margin:10px 0;overflow-x:auto;flex-wrap:nowrap;padding-bottom:4px"><button class="chip ${!st.cat ? 'on' : ''}" data-cat="">Всички</button>${Object.entries(FOOD_CATS).map(([k, v]) => `<button class="chip ${st.cat === k ? 'on' : ''}" data-cat="${k}" style="white-space:nowrap">${v}</button>`).join('')}</div>
      <div class="row small muted" style="flex-wrap:wrap;gap:12px;margin:4px 0 6px">${Object.values(VERDICT).map((v) => `<span class="row" style="gap:6px"><span class="dot ${v.cls}"></span>${v.short}</span>`).join('')}</div>
      <div id="fl">${list()}</div>${disclaimer()}</div>`;
    if (keepFocus) { const i = $('#fq', root); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }
  }
  root.addEventListener('input', (e) => { if (e.target.id === 'fq') { st.q = e.target.value; $('#fl', root).innerHTML = list(); } });
  root.addEventListener('click', (e) => { const c = e.target.closest('[data-cat]'); if (c) { st.cat = c.dataset.cat; render(); } });
  render();
}

export function foodItemView(root, id) {
  const dog = store.activeDog();
  const f = FOODS.find((x) => x.id === id);
  if (!f) { root.innerHTML = topbar('Няма такава храна', { back: '#/food' }); return; }
  const p = foodFor(f, dog);
  const sos = f.sos ? SOS.find((s) => s.id === f.sos) : null;
  root.innerHTML = `${topbar(f.name, { back: '#/food/search' })}<div class="view">
    <div class="card"><span class="pill ${VERDICT[p.verdict].cls}" style="font-size:.9rem">${esc(VERDICT[p.verdict].label)}</span>
      ${p.verdict !== f.verdict ? `<p class="small muted" style="margin:6px 0 0">Общо: ${esc(VERDICT[f.verdict].label.toLowerCase())} · за ${esc(dog.name)}: ${esc(VERDICT[p.verdict].label.toLowerCase())}</p>` : ''}
      <p style="margin:12px 0 0">${esc(f.summary)}</p></div>
    ${p.why.length ? `<div class="why"><b>Защо е различно за ${esc(dog.name)}:</b><ul style="margin:4px 0 0;padding-left:18px">${p.why.map((w) => `<li>${esc(w)}</li>`).join('')}</ul></div>` : ''}
    ${f.how.length ? `<div class="box do"><h4>Как да го дадете</h4><ul>${f.how.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}
    ${f.warn.length ? `<div class="box ${f.verdict === 'danger' ? 'red' : 'dont'}"><h4>Внимание</h4><ul>${f.warn.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}
    ${(p.verdict === 'ok' || p.verdict === 'care') ? `<div class="box info small">${esc(treatLine(dog) || 'Лакомствата общо – под 10% от дневните калории (WSAVA).')}</div>` : ''}
    ${sos ? `<a class="item" href="#/sos/${sos.id}" style="border:2px solid var(--danger)"><span style="color:var(--danger)">${icon('sos')}</span><span class="grow"><span class="t">Ако вече го е изяло</span><span class="s" style="display:block">${esc(sos.title)}</span></span>${icon('chevron', 'chev')}</a>${f.verdict === 'danger' ? vetCallBar() : ''}` : ''}
    ${sourcesList(f.src)}
    ${disclaimer()}</div>`;
}

function kitchen(root, dog) {
  const st = { showAll: false, kind: '' };
  function render() {
    const items = RECIPES.map((r) => ({ r, p: recipeFor(r, dog) }));
    const ok = items.filter((x) => x.p.status !== 'hidden' && (!st.kind || x.r.kind === st.kind));
    const hidden = items.filter((x) => x.p.status === 'hidden');
    const tl = treatLine(dog);
    const f = profileFlags(dog);
    root.innerHTML = `${topbar('Хранене')}<div class="view">${tabs('kitchen')}
      <div class="box info small">${icon('info', 'sm')} Рецепти за <b>лакомства</b> от ветеринарни организации (PDSA – одобрени от ветеринари; AKC). Не са пълноценна храна.${tl ? '<br>' + esc(tl) : ''}</div>
      ${f.has('serious') ? `<div class="box red small">${esc(dog.name)} има заболяване или специална диета – показваме само лакомства от собствената му храна. Другите – след одобрение от ветеринаря.</div>` : ''}
      <div class="chips" style="margin:10px 0"><button class="chip ${!st.kind ? 'on' : ''}" data-kind="">Всички</button><button class="chip ${st.kind === 'baked' ? 'on' : ''}" data-kind="baked">Печени</button><button class="chip ${st.kind === 'frozen' ? 'on' : ''}" data-kind="frozen">Замразени</button><button class="chip ${st.kind === 'pan' ? 'on' : ''}" data-kind="pan">На тиган</button><button class="chip ${st.kind === 'fresh' ? 'on' : ''}" data-kind="fresh">Без готвене</button></div>
      <h3 class="section-title">Подходящи за ${esc(dog.name)} (${ok.length})</h3>
      ${ok.map(({ r, p }) => `<a class="item" href="#/food/recipe/${r.id}"><span style="color:var(--brand)">${icon(r.kind === 'frozen' ? 'sparkle' : 'bowl')}</span><span class="grow"><span class="t">${esc(r.title)}</span><span class="s" style="display:block">${p.status === 'warn' ? '⚠ ' + esc(p.reasons[0]) : esc(r.yield)}</span></span>${icon('chevron', 'chev')}</a>`).join('') || '<div class="empty">Няма подходящи рецепти за избрания филтър.</div>'}
      ${hidden.length ? `<button class="btn ghost block" data-act="toggle" style="margin-top:12px">${st.showAll ? 'Скрий' : 'Покажи'} неподходящите (${hidden.length})</button>
        ${st.showAll ? hidden.map(({ r, p }) => `<a class="item" href="#/food/recipe/${r.id}" style="opacity:.7"><span class="dot v-no"></span><span class="grow"><span class="t">${esc(r.title)}</span><span class="s" style="display:block">${esc(p.reasons[0])}</span></span>${icon('chevron', 'chev')}</a>`).join('') : ''}` : ''}
      ${disclaimer()}</div>`;
  }
  root.addEventListener('click', (e) => {
    const k = e.target.closest('[data-kind]'); if (k) { st.kind = k.dataset.kind; render(); }
    if (e.target.closest('[data-act="toggle"]')) { st.showAll = !st.showAll; render(); }
  });
  render();
}

export function recipeView(root, id) {
  const dog = store.activeDog();
  const r = RECIPES.find((x) => x.id === id);
  if (!r) { root.innerHTML = topbar('Няма такава рецепта', { back: '#/food/kitchen' }); return; }
  const p = recipeFor(r, dog);
  const yt = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(r.video || r.title);
  root.innerHTML = `${topbar('Рецепта', { back: '#/food/kitchen' })}<div class="view">
    <h2 style="margin:4px 0 6px;font-size:1.35rem">${esc(r.title)}</h2>
    <div class="row small muted" style="flex-wrap:wrap;gap:12px">${r.minutes ? `<span class="row" style="gap:4px">${icon('clock', 'sm')} ~${r.minutes} мин.</span>` : ''}<span>${esc(r.yield)}</span></div>
    ${p.status === 'hidden' ? `<div class="box red"><h4>Не е подходяща за ${esc(dog.name)}</h4><ul>${p.reasons.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}
    ${p.status === 'warn' ? `<div class="box dont"><h4>Внимание за ${esc(dog.name)}</h4><ul>${p.reasons.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}
    <div class="card"><h2>Съставки</h2><ul class="prose" style="padding-left:18px;margin:0">${r.ingredients.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
    <div class="card"><h2>Приготвяне</h2><ol style="padding-left:20px;margin:0">${r.steps.map((x) => `<li style="margin:6px 0">${esc(x)}</li>`).join('')}</ol>
      ${r.storage ? `<p class="small" style="margin:10px 0 0"><b>Съхранение:</b> ${esc(r.storage)}</p>` : ''}</div>
    <div class="card"><h2>Колко да дам на ${esc(dog.name)}?</h2>
      ${p.portion ? `<p style="margin:0 0 8px"><b>${esc(p.portion)}</b></p>` : ''}
      <p class="small" style="margin:0">${p.treatKcal ? `Всички лакомства за деня – до ~${p.treatKcal} ккал (10% от дневните калории). Намалете основната храна със същото.` : 'Всички лакомства за деня – под 10% от дневните калории (WSAVA). Въведете тегло, за да изчислим лимита.'}</p></div>
    ${r.notFor.length ? `<div class="box dont"><h4>Не е подходяща за</h4><ul>${r.notFor.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}
    <div class="box do small"><b>Винаги:</b> без ксилитол (брезова захар), шоколад, стафиди/грозде, лук, чесън и макадамия. Нова храна – в малко количество.</div>
    <a class="item" href="${yt}" target="_blank" rel="noopener"><span style="color:var(--danger)">${icon('play')}</span><span class="grow"><span class="t">Потърси видео в YouTube</span><span class="s" style="display:block">Търсене, не проверено видео – сравнете съставките с тези тук</span></span>${icon('link', 'chev')}</a>
    ${sourcesList([r.src])}
    ${disclaimer()}</div>`;
}

function calcView(root, dog) {
  const st = { kcalKg: dog.foodKcalPerKg || '' };
  function render() {
    const d = { ...dog, foodKcalPerKg: Number(st.kcalKg) || null };
    const p = energyPlan(d);
    root.innerHTML = `${topbar('Хранене')}<div class="view">${tabs('calc')}
      <div class="card"><div class="row between"><h2>Колко храна за ${esc(dog.name)}?</h2><a class="btn sm ghost" href="#/me/edit">${icon('edit', 'sm')} Профил</a></div>
        <p class="small muted" style="margin:0">${esc(dog.weight ? String(dog.weight).replace('.', ',') + ' кг' : 'без тегло')} · ${esc(ACTIVITY[dog.activity]?.label || 'активност не е посочена')}${dog.bcs ? ` · кондиция ${dog.bcs}/9` : ''}</p>
        ${p.refer ? `<div class="box dont" style="margin-top:12px">${esc(p.refer)}</div>` : `
        <div style="margin:14px 0 4px" class="small muted">Начална стойност (енергия на ден)</div>
        <div class="big">${fmt(p.kcal, 0)} <span style="font-size:1rem">ккал</span></div>
        ${p.min ? `<div class="small muted">Обхват на WSAVA за това тегло: ${fmt(p.min, 0)}–${fmt(p.max, 0)} ккал</div>` : ''}
        <div class="kpis" style="margin-top:12px">
          <div class="kpi"><span class="small muted">Лакомства до</span><b>${fmt(p.treatKcal, 0)} ккал</b></div>
          <div class="kpi"><span class="small muted">Храна на ден</span><b>${p.gramsFull ? fmt(p.gramsFull, 0) + ' г' : '—'}</b>${p.gramsWithTreats ? `<span class="tiny muted">или ${fmt(p.gramsWithTreats, 0)} г, ако даваш и лакомства</span>` : ''}</div>
        </div>
        <label class="f" for="kk">Калории на храната (ккал/кг от етикета)</label>
        <input id="kk" type="number" inputmode="numeric" min="500" max="6000" value="${esc(st.kcalKg)}" placeholder="напр. 3600">
        <p class="hint">Ако на етикета пише за 100 г – умножете по 10. ${dog.foodType ? 'Вид храна: ' + esc(FOOD_TYPES[dog.foodType] || '') : ''}</p>
        ${p.gramsFull ? `<button class="btn sm ghost" data-act="save">${icon('check', 'sm')} Запази в профила</button>` : ''}
        <details class="small" style="margin-top:12px"><summary>Как е изчислено</summary><p>${esc(p.method)}</p>${p.bandNote ? `<p>${esc(p.bandNote)}</p>` : ''}</details>`}
      </div>
      ${p.notes?.length ? `<div class="box info small"><ul>${p.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul></div>` : ''}
      ${p.growth ? `<div class="card flat small"><b>Растеж:</b> при очаквано тегло ${fmt(p.growth.adult)} кг като възрастно, на тази възраст кривата на FEDIAF е около ${fmt(p.growth.pct, 0)}% → ~${fmt(p.growth.expectedKg)} кг.</div>` : ''}
      <div class="card flat small"><b>Важно:</b> това е ориентировъчна начална стойност. Дайте я 2–4 седмици, теглете кучето и следете формата му (идеално 4–5/9). Ако напълнява – намалете; ако отслабва – увеличете. Таблицата на опаковката също е добра отправна точка.</div>
      <a class="item" href="#/care/a/bcs"><span style="color:var(--accent)">${icon('scale')}</span><span class="grow"><span class="t">Как да проверя дали е с идеално тегло?</span></span>${icon('chevron', 'chev')}</a>
      ${sourcesList(p.src || ['fediaf'])}
      ${disclaimer()}</div>`;
  }
  root.addEventListener('input', (e) => { if (e.target.id === 'kk') { st.kcalKg = e.target.value; clearTimeout(st.t); st.t = setTimeout(() => { render(); const i = $('#kk', root); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 500); } });
  root.addEventListener('click', (e) => { if (e.target.closest('[data-act="save"]')) { store.upsertDog({ ...dog, foodKcalPerKg: Number(st.kcalKg) }); import('../util.js').then((u) => u.toast('Запазено')); } });
  render();
}
