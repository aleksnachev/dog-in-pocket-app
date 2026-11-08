// Общи UI елементи
import { esc } from './util.js';
import { icon } from './icons.js';
import { SOURCES } from '../data/sources.js';
import { VERDICT, foodFor, recipeFor } from './personalize.js';
import { SOS } from '../data/sos.js';
import { store } from './store.js';

export function avatar(dog, cls = '') {
  if (!dog) return `<span class="avatar ${cls}">${icon('paw')}</span>`;
  if (dog.photo) return `<span class="avatar ${cls}"><img src="${dog.photo}" alt=""></span>`;
  return `<span class="avatar ${cls}">${esc((dog.name || '?').slice(0, 1).toUpperCase())}</span>`;
}

export function topbar(title, { back = null, right = '' } = {}) {
  return `<header class="topbar">${back ? `<a class="back" href="${back}" aria-label="Назад">${icon('back')}</a>` : ''}<h1>${esc(title)}</h1>${right}</header>`;
}

export function sourcesList(keys = []) {
  const uniq = [...new Set(keys.filter(Boolean))];
  if (!uniq.length) return '';
  return `<details class="sources"><summary>Източници (${uniq.length}) · проверено ${esc(SOURCES[uniq[0]]?.checked || '')}</summary><ul>${uniq.map((k) => {
    const s = SOURCES[k];
    if (!s) return '';
    return `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.org)} – ${esc(s.title)}</a>${s.note ? ` <em>(${esc(s.note)})</em>` : ''}</li>`;
  }).join('')}</ul></details>`;
}

export function verdictPill(v) {
  const V = VERDICT[v];
  return `<span class="pill ${V.cls}">${esc(V.short)}</span>`;
}

export function vetCallBar() {
  const dog = store.activeDog();
  const vet = dog?.vetPhone ? `<a class="btn danger" href="tel:${esc(dog.vetPhone)}">${icon('phone', 'sm')} ${esc(dog.vetName || 'Моят ветеринар')}</a>` : `<a class="btn danger" href="#/me/edit?focus=vet">${icon('phone', 'sm')} Добави ветеринар</a>`;
  const er = dog?.erPhone ? `<a class="btn ghost" href="tel:${esc(dog.erPhone)}">${icon('phone', 'sm')} ${esc(dog.erName || 'Денонощна клиника')}</a>` : `<a class="btn ghost" href="https://www.google.com/maps/search/денонощна+ветеринарна+клиника" target="_blank" rel="noopener">${icon('search', 'sm')} Денонощни клиники</a>`;
  return `<div class="callbar">${vet}${er}</div>`;
}

export function emergencyCard(sosIds = []) {
  const items = sosIds.map((id) => SOS.find((s) => s.id === id)).filter(Boolean);
  if (!items.length) return '';
  return `<section class="emergency" role="alert">
    <h3>${icon('alert')} Това може да е спешно</h3>
    <p class="small" style="margin:0 0 8px">Не чакайте да се появят симптоми. Отворете инструкциите и се свържете с ветеринар.</p>
    ${items.map((s) => `<a class="item" href="#/sos/${s.id}"><span class="grow"><span class="urg ${s.urgency}">${s.urgency === 'now' ? 'Веднага' : s.urgency === 'today' ? 'Днес' : 'Наблюдавайте'}</span><span class="t" style="display:block">${esc(s.title)}</span></span>${icon('chevron', 'chev')}</a>`).join('')}
    ${vetCallBar()}
  </section>`;
}

const URG = { now: ['Веднага към ветеринар', 'now'], today: ['Ветеринар днес', 'today'], watch: ['Наблюдавайте у дома', 'watch'] };

export function resultItem(r, dog) {
  const it = r.item;
  if (r.type === 'food') {
    const p = foodFor(it, dog);
    return `<a class="item" href="#/food/item/${it.id}"><span class="dot ${VERDICT[p.verdict].cls}"></span><span class="grow"><span class="t">${esc(it.name)}</span><span class="s" style="display:block">${esc(VERDICT[p.verdict].label)}${p.verdict !== it.verdict ? ' · за ' + esc(dog?.name || 'кучето') : ''}</span></span>${icon('chevron', 'chev')}</a>`;
  }
  if (r.type === 'sos') {
    return `<a class="item" href="#/sos/${it.id}"><span style="color:var(--danger)">${icon('sos')}</span><span class="grow"><span class="t">${esc(it.title)}</span><span class="s urg ${URG[it.urgency][1]}" style="display:block">${URG[it.urgency][0]}</span></span>${icon('chevron', 'chev')}</a>`;
  }
  if (r.type === 'article') {
    return `<a class="item" href="#/care/a/${it.id}"><span style="color:var(--accent)">${icon('book')}</span><span class="grow"><span class="t">${esc(it.title)}</span><span class="s" style="display:block">${esc(it.summary)}</span></span>${icon('chevron', 'chev')}</a>`;
  }
  const rr = recipeFor(it, dog);
  return `<a class="item" href="#/food/recipe/${it.id}"><span style="color:var(--brand)">${icon('bowl')}</span><span class="grow"><span class="t">${esc(it.title)}</span><span class="s" style="display:block">${rr.status === 'hidden' ? 'Не е подходяща за ' + esc(dog?.name || 'кучето') : 'Лакомство · ' + esc(it.yield || '')}</span></span>${icon('chevron', 'chev')}</a>`;
}

export function disclaimer() {
  return `<p class="disclaimer">„Кучето в джоба“ дава обща информация от ветеринарни източници и не замества преглед и съвет от ветеринарен лекар. При спешност се свържете с ветеринар веднага.</p>`;
}

export const logoSVG = `<svg class="logo" viewBox="0 0 96 96" aria-hidden="true"><rect x="10" y="20" width="76" height="66" rx="18" fill="var(--brand)"/><path d="M10 40h76" stroke="#fff" stroke-opacity=".35" stroke-width="3"/><circle cx="34" cy="50" r="5" fill="#fff"/><circle cx="44" cy="43" r="5" fill="#fff"/><circle cx="56" cy="43" r="5" fill="#fff"/><circle cx="66" cy="50" r="5" fill="#fff"/><path d="M38 70c0-7 5-12 12-12s12 5 12 12c0 4-5 6-12 6s-12-2-12-6z" fill="#fff"/><path d="M30 20c0-8 6-12 18-12s18 4 18 12" fill="none" stroke="var(--brand)" stroke-width="6" stroke-linecap="round"/></svg>`;
