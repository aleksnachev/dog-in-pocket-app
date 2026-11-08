import { esc, $, fmtDate, todayISO, download, toast } from '../util.js';
import { icon } from '../icons.js';
import { store } from '../store.js';
import { topbar, avatar, disclaimer } from '../components.js';
import { dogSummary, ALLERGENS, CONDITIONS, ACTIVITY, FOOD_TYPES, STAGE_LABEL, lifeStage, breedOf } from '../profile.js';
import { SECTIONS, bindForm, cleanDog } from './profileForm.js';
import { SIZE_CLASSES, adultSize } from '../../data/breeds.js';
import { energyPlan, fmt } from '../calc.js';
import { SOURCES } from '../../data/sources.js';
import { CONFIG } from '../config.js';

function chart(list) {
  if (list.length < 2) return '';
  const W = 320, H = 140, P = 24;
  const xs = list.map((w) => new Date(w.date).getTime()), ys = list.map((w) => w.kg);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys) * 0.97, y1 = Math.max(...ys) * 1.03;
  const X = (t) => P + (W - 2 * P) * ((t - x0) / Math.max(1, x1 - x0));
  const Y = (v) => H - P - (H - 2 * P) * ((v - y0) / Math.max(0.01, y1 - y0));
  const pts = list.map((w, i) => `${X(xs[i]).toFixed(1)},${Y(w.kg).toFixed(1)}`).join(' ');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Графика на теглото"><line class="ax" x1="${P}" y1="${H - P}" x2="${W - P}" y2="${H - P}"/>
    <polyline class="ln" points="${pts}"/>${list.map((w, i) => `<circle class="pt" cx="${X(xs[i]).toFixed(1)}" cy="${Y(w.kg).toFixed(1)}" r="3.5"/>`).join('')}
    <text x="${P}" y="${H - 6}">${fmtDate(list[0].date)}</text><text x="${W - P}" y="${H - 6}" text-anchor="end">${fmtDate(list[list.length - 1].date)}</text>
    <text x="${P}" y="12">${fmt(Math.max(...ys))} кг</text></svg>`;
}

export function myDogView(root) {
  const s = store.get();
  const dog = store.activeDog();
  const weights = s.weights[dog.id] || [];
  const plan = energyPlan(dog);
  const b = breedOf(dog);
  const kv = (k, v) => (v ? `<div class="row between small" style="padding:6px 0;border-bottom:1px solid var(--line)"><span class="muted">${k}</span><span style="text-align:right">${v}</span></div>` : '');
  root.innerHTML = `${topbar('Моето куче')}<div class="view">
    ${s.dogs.length > 1 ? `<div class="chips" style="margin-bottom:8px">${s.dogs.map((d) => `<button class="chip ${d.id === dog.id ? 'on' : ''}" data-switch="${d.id}">${esc(d.name)}</button>`).join('')}</div>` : ''}
    <div class="card"><div class="row">${avatar(dog, 'xl')}<div class="grow"><h2 style="margin:0">${esc(dog.name)}</h2><div class="small muted">${esc(dogSummary(dog))}</div><div class="small">${esc(STAGE_LABEL[lifeStage(dog)])}</div></div></div>
      <div style="margin-top:12px">
        ${kv('Порода', esc(b ? b.name : (dog.breedText || 'смесена / неизвестна')))}
        ${kv('Размер като възрастно', esc(SIZE_CLASSES[adultSize(dog)]?.label || ''))}
        ${kv('Пол', dog.sex === 'f' ? 'женско' : 'мъжко')}${kv('Кастрирано', { yes: 'да', no: 'не', unknown: 'не знам' }[dog.neutered])}
        ${kv('Рождена дата', dog.birthDate ? fmtDate(dog.birthDate) + (dog.birthApprox ? ' (прибл.)' : '') : '')}
        ${kv('Активност', esc(ACTIVITY[dog.activity]?.label || ''))}${kv('Телесна форма', dog.bcs ? dog.bcs + '/9' : '')}
        ${kv('Храна', esc(FOOD_TYPES[dog.foodType] || ''))}${kv('Енергия на ден', plan.ok ? '~' + fmt(plan.kcal, 0) + ' ккал' : '')}
        ${kv('Алергии', esc((dog.allergies || []).map((a) => ALLERGENS[a]).join(', ')))}
        ${kv('Състояния', esc((dog.conditions || []).map((c) => CONDITIONS[c]).join('; ')))}
        ${kv('Ветеринар', dog.vetPhone ? `${esc(dog.vetName || '')} <a href="tel:${esc(dog.vetPhone)}">${esc(dog.vetPhone)}</a>` : '')}
      </div>
      <div class="row" style="margin-top:12px"><a class="btn primary grow" href="#/me/edit">${icon('edit', 'sm')} Редактирай</a><button class="btn ghost" data-act="passport">${icon('share', 'sm')} Паспорт</button></div>
    </div>

    <div class="card"><div class="row between"><h2>${icon('scale', 'sm')} Тегло</h2></div>
      ${chart(weights)}
      <form id="wf" class="row" style="margin-top:8px"><input id="wkg" type="text" inputmode="decimal" autocomplete="off" placeholder="кг" style="max-width:110px" aria-label="Тегло в кг"><input id="wd" type="date" value="${todayISO()}" max="${todayISO()}" aria-label="Дата"><button class="btn accent" type="submit">${icon('plus', 'sm')}</button></form>
      ${weights.length ? `<details class="small" style="margin-top:8px"><summary>Всички записи (${weights.length})</summary>${weights.slice().reverse().map((w) => `<div class="row between" style="padding:4px 0"><span>${fmtDate(w.date)}</span><span>${fmt(w.kg)} кг <button class="iconbtn" data-wdel="${w.date}" aria-label="Изтрий">${icon('trash', 'sm')}</button></span></div>`).join('')}</details>` : '<p class="hint">Теглете кучето на всеки 2–4 седмици – така калкулаторът и съветите остават точни.</p>'}
    </div>

    <div class="card"><h2>${icon('note', 'sm')} Бележки</h2>
      <form id="nf" class="row"><input id="nt" type="text" maxlength="200" placeholder="напр. смени храната на…" aria-label="Нова бележка"><button class="btn accent" type="submit">${icon('plus', 'sm')}</button></form>
      ${s.notes.filter((n) => n.dogId === dog.id).slice(0, 20).map((n) => `<div class="row between small" style="padding:6px 0;border-bottom:1px solid var(--line)"><span><span class="muted">${fmtDate(n.date)}</span> · ${esc(n.text)}</span><button class="iconbtn" data-ndel="${n.id}" aria-label="Изтрий">${icon('trash', 'sm')}</button></div>`).join('')}
    </div>

    <h3 class="section-title">Кучета</h3>
    <a class="item" href="#/onboarding/add"><span style="color:var(--brand)">${icon('plus')}</span><span class="grow"><span class="t">Добави още едно куче</span></span>${icon('chevron', 'chev')}</a>

    <h3 class="section-title">Данни и настройки</h3>
    <button class="item" data-act="export"><span>${icon('download')}</span><span class="grow"><span class="t">Резервно копие</span><span class="s" style="display:block">Запазете файл – данните са само на това устройство</span></span></button>
    <label class="item" style="cursor:pointer"><span>${icon('upload')}</span><span class="grow"><span class="t">Възстанови от копие</span></span><input type="file" accept="application/json,.json" class="sr" data-act="import"></label>
    <a class="item" href="#/settings"><span>${icon('sparkle')}</span><span class="grow"><span class="t">Настройки</span><span class="s" style="display:block">Тема, AI помощник</span></span>${icon('chevron', 'chev')}</a>
    <a class="item" href="#/about"><span>${icon('info')}</span><span class="grow"><span class="t">За приложението и източниците</span></span>${icon('chevron', 'chev')}</a>
    <button class="item" data-act="delete" style="color:var(--danger)"><span>${icon('trash')}</span><span class="grow"><span class="t">Изтрий профила на ${esc(dog.name)}</span></span></button>
    ${disclaimer()}</div>
    <dialog id="pp"><div class="dlg" id="ppc"></div></dialog>`;

  root.addEventListener('submit', (e) => {
    e.preventDefault();
    if (e.target.id === 'wf') { const kg = Number($('#wkg', root).value.replace(',', '.')); if (kg > 0) { store.addWeight(dog.id, kg, $('#wd', root).value || todayISO()); toast('Теглото е записано'); rerender(); } }
    if (e.target.id === 'nf') { const t = $('#nt', root).value.trim(); if (t) { store.addNote(dog.id, t); rerender(); } }
  });
  root.addEventListener('click', (e) => {
    const t = e.target.closest('[data-act],[data-switch],[data-wdel],[data-ndel]');
    if (!t) return;
    if (t.dataset.switch) { store.setActive(t.dataset.switch); rerender(); }
    if (t.dataset.wdel) { store.removeWeight(dog.id, t.dataset.wdel); rerender(); }
    if (t.dataset.ndel) { store.removeNote(t.dataset.ndel); rerender(); }
    const a = t.dataset.act;
    if (a === 'export') download(`kucheto-v-dzhoba-${todayISO()}.json`, store.exportJSON());
    if (a === 'delete' && confirm(`Да изтрия ли всички данни за ${dog.name}? Това не може да се отмени.`)) { store.removeDog(dog.id); location.hash = store.get().dogs.length ? '#/me' : '#/onboarding'; }
    if (a === 'passport') passport(root, dog);
  });
  root.addEventListener('change', async (e) => {
    if (e.target.dataset.act === 'import' && e.target.files?.[0]) {
      if (!confirm('Възстановяването ще замени текущите данни. Продължи?')) return;
      try { store.importJSON(await e.target.files[0].text()); toast('Данните са възстановени'); rerender(); } catch { toast('Файлът не може да бъде прочетен'); }
    }
  });
}

const rerender = () => window.dispatchEvent(new HashChangeEvent('hashchange'));

function passport(root, dog) {
  const b = breedOf(dog);
  const lines = [
    `🐾 ${dog.name}`,
    `${b ? b.name : (dog.breedText || 'смесена порода')}, ${dog.sex === 'f' ? 'женско' : 'мъжко'}${dog.birthDate ? ', родено ' + fmtDate(dog.birthDate) : ''}`,
    dog.weight ? `Тегло: ${String(dog.weight).replace('.', ',')} кг` : '',
    (dog.allergies || []).length ? `⚠ Алергии: ${(dog.allergies || []).map((a) => ALLERGENS[a]).join(', ')}` : '',
    (dog.conditions || []).length ? `Здравословни особености: ${(dog.conditions || []).map((c) => CONDITIONS[c]).join('; ')}` : '',
    dog.foodType ? `Храна: ${FOOD_TYPES[dog.foodType]}` : '',
    dog.vetPhone ? `Ветеринар: ${dog.vetName || ''} ${dog.vetPhone}` : '',
    dog.erPhone ? `Денонощна клиника: ${dog.erName || ''} ${dog.erPhone}` : '',
    'Забранени храни: шоколад, грозде/стафиди, лук, чесън, ксилитол (дъвки), макадамия, кости.',
    'Това не е официалният ветеринарен паспорт.',
  ].filter(Boolean).join('\n');
  const dlg = $('#pp', root);
  $('#ppc', root).innerHTML = `<h2>Карта на ${esc(dog.name)}</h2><p class="small muted">За човека, който гледа кучето. Не съдържа вашия адрес.</p><pre style="white-space:pre-wrap;font:inherit;background:var(--surface-2);padding:12px;border-radius:12px">${esc(lines)}</pre>
    <div class="row"><button class="btn primary grow" data-pp="share">${icon('share', 'sm')} Сподели</button><button class="btn ghost" data-pp="close">Затвори</button></div>`;
  dlg.showModal();
  dlg.onclick = async (e) => {
    const a = e.target.closest('[data-pp]')?.dataset.pp;
    if (a === 'close' || e.target === dlg) dlg.close();
    if (a === 'share') { try { if (navigator.share) await navigator.share({ title: dog.name, text: lines }); else { await navigator.clipboard.writeText(lines); toast('Копирано'); } } catch { /* отказано */ } }
  };
}

export function editView(root, params) {
  const dog = store.activeDog();
  const d = { ...dog, allergies: [...(dog.allergies || [])], conditions: [...(dog.conditions || [])], interests: [...(dog.interests || [])], ageMode: dog.birthApprox ? 'exact' : 'exact', breedKnown: dog.breedId ? 'yes' : 'no' };
  function render(focus) {
    root.innerHTML = `${topbar('Редакция', { back: '#/me' })}<div class="view"><form class="sec" onsubmit="return false">
      ${['basics', 'age', 'breed', 'body', 'health', 'vet'].map((k) => `<section class="card" id="sec-${k}"><h2>${esc(SECTIONS[k].title)}</h2>${SECTIONS[k].render(d)}</section>`).join('')}
      </form><p id="err" class="hint" role="alert" style="color:var(--danger)"></p>
      <button class="btn primary block" data-act="save">${icon('check', 'sm')} Запази</button></div>`;
    bindForm($('.sec', root), d, (re) => { if (re) { const y = window.scrollY; render(document.activeElement?.dataset?.f); window.scrollTo(0, y); } });
    if (focus) { const el = root.querySelector(`[data-f="${focus}"]`); if (el) { el.focus({ preventScroll: true }); const v = el.value; el.value = ''; el.value = v; } }
  }
  root.addEventListener('click', (e) => {
    if (!e.target.closest('[data-act="save"]')) return;
    for (const k of ['basics', 'age', 'breed', 'body']) { const err = SECTIONS[k].valid(d); if (err) { $('#err', root).textContent = err; return; } }
    store.upsertDog(cleanDog(d)); toast('Запазено'); location.hash = '#/me';
  });
  render();
  if (params.get('focus') === 'vet') $('#sec-vet', root)?.scrollIntoView();
}

export function settingsView(root) {
  const s = store.get().settings;
  const theme = localStorage.getItem('theme') || 'auto';
  root.innerHTML = `${topbar('Настройки', { back: '#/me' })}<div class="view">
    <div class="card"><h2>Тема</h2><div class="chips">${[['auto', 'Автоматично'], ['light', 'Светла'], ['dark', 'Тъмна']].map(([k, l]) => `<button class="chip ${theme === k ? 'on' : ''}" data-theme="${k}">${l}</button>`).join('')}</div></div>
    <div class="card"><h2>${icon('sparkle', 'sm')} AI помощник (по избор)</h2>
      <p class="small muted">Локалното търсене работи винаги. AI помощникът (ако е включен в абонамента/покупката) обяснява по-подробно, но САМО от проверената база на приложението и изисква интернет.</p>
      <label class="f" for="ai1">Адрес на AI сървъра</label><input id="ai1" type="url" value="${esc(s.aiEndpoint || CONFIG.aiEndpoint)}" placeholder="https://…">
      <label class="f" for="ai2">Код за достъп</label><input id="ai2" type="text" value="${esc(s.accessCode || '')}" autocomplete="off">
      <button class="btn accent" data-act="saveai" style="margin-top:10px">Запази</button></div>
    ${disclaimer()}</div>`;
  root.addEventListener('click', (e) => {
    const t = e.target.closest('[data-theme]');
    if (t) { const v = t.dataset.theme; if (v === 'auto') { localStorage.removeItem('theme'); delete document.documentElement.dataset.theme; } else { localStorage.setItem('theme', v); document.documentElement.dataset.theme = v; } rerender(); }
    if (e.target.closest('[data-act="saveai"]')) { store.setSetting('aiEndpoint', $('#ai1', root).value.trim()); store.setSetting('accessCode', $('#ai2', root).value.trim()); toast('Запазено'); }
  });
}

export function aboutView(root) {
  const groups = {};
  Object.entries(SOURCES).forEach(([k, s]) => { (groups[s.org] = groups[s.org] || []).push(s); });
  root.innerHTML = `${topbar('За приложението', { back: '#/me' })}<div class="view prose">
    <h2>Кучето в джоба</h2>
    <p>Персонализиран дигитален помощник за хранене, ежедневни грижи, безопасност и профилактика на кучето. Версия ${CONFIG.appVersion}, съдържание от ${fmtDate(CONFIG.contentVersion)}.</p>
    <div class="box info small"><b>Как подбираме информацията:</b> използваме само ветеринарни и научни източници – FEDIAF (европейски хранителни стандарти), WSAVA (Световна асоциация на ветеринарните лекари за дребни животни), MSD/Merck Veterinary Manual, PDSA (британска ветеринарна благотворителна организация), ASPCA Animal Poison Control, ESCCAP (паразити), AKC (ветеринарно прегледани статии) и БАБХ. Всеки отговор показва своите източници.</div>
    <div class="box dont small"><b>Ограничения:</b> приложението не поставя диагнози, не препоръчва лекарства и дози и не замества ветеринарен преглед. Съдържанието се преглежда от ветеринарен лекар преди всяка версия.</div>
    <h3>Поверителност</h3><p class="small">Профилът, теглото, бележките и календарът се пазят само на вашето устройство (localStorage). Ако използвате AI помощника, към сървъра се изпраща въпросът и обобщен профил без името на кучето.</p>
    <h3>Източници (${Object.keys(SOURCES).length})</h3>
    ${Object.entries(groups).map(([org, list]) => `<details class="sources"><summary>${esc(org)} (${list.length})</summary><ul>${list.map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a> · ${esc(s.checked)}</li>`).join('')}</ul></details>`).join('')}
    ${disclaimer()}</div>`;
}
