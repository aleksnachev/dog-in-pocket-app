import { esc, $, fmtDate, todayISO, addDays, daysBetween, download, toast, uid } from '../util.js';
import { icon } from '../icons.js';
import { store } from '../store.js';
import { ARTICLES, CARE_CATS, EVENT_TYPES } from '../../data/care.js';
import { topbar, sourcesList, disclaimer } from '../components.js';
import { profileFlags } from '../profile.js';

const tabs = (on) => `<nav class="seg" style="margin:4px 0 12px">${[['for', 'За кучето'], ['calendar', 'Календар'], ['all', 'Всички теми']].map(([k, l]) => `<a href="#/care/${k}" class="${on === k ? 'on' : ''}">${l}</a>`).join('')}</nav>`;
const INTEREST_ART = { pulling: ['pulling'], alone: ['alone'], fireworks: ['fireworks_training'], car: ['car'], weight: ['bcs', 'weight_loss'], puppy: ['vaccines', 'deworming', 'change_food'], senior: ['checkups', 'life_stage'], travel: ['travel_eu'] };

const artRow = (a) => `<a class="item" href="#/care/a/${a.id}"><span style="color:var(--accent)">${icon('book')}</span><span class="grow"><span class="t">${esc(a.title)}</span><span class="s" style="display:block">${esc(a.summary)}</span></span>${icon('chevron', 'chev')}</a>`;

export function careView(root, params, sub = 'for') {
  const dog = store.activeDog();
  if (sub === 'calendar') return calendar(root, dog);
  if (sub === 'all') {
    root.innerHTML = `${topbar('Грижи')}<div class="view">${tabs('all')}${Object.entries(CARE_CATS).map(([k, l]) => `<h3 class="section-title">${esc(l)}</h3>${ARTICLES.filter((a) => a.cat === k).map(artRow).join('')}`).join('')}${disclaimer()}</div>`;
    return;
  }
  const f = profileFlags(dog);
  const ids = new Set();
  (dog.interests || []).forEach((i) => (INTEREST_ART[i] || []).forEach((x) => ids.add(x)));
  ARTICLES.filter((a) => a.show.some((s) => f.has(s))).forEach((a) => ids.add(a.id));
  ['feeding_basics', 'bg_law', 'vector'].forEach((x) => ids.add(x));
  const picked = [...ids].map((id) => ARTICLES.find((a) => a.id === id)).filter(Boolean);
  root.innerHTML = `${topbar('Грижи')}<div class="view">${tabs('for')}
    <p class="small muted" style="margin:0 0 4px">Подбрано според профила на ${esc(dog.name)}${(dog.interests || []).length ? ' и избраните интереси' : ''}.</p>
    ${picked.map(artRow).join('')}
    <h3 class="section-title">Полезни списъци</h3>
    <a class="item" href="#/care/a/first_aid_kit"><span style="color:var(--brand)">${icon('plus')}</span><span class="grow"><span class="t">Аптечка за кучето</span></span>${icon('chevron', 'chev')}</a>
    <a class="item" href="#/care/a/home_safety"><span style="color:var(--brand)">${icon('shield')}</span><span class="grow"><span class="t">Безопасен дом</span></span>${icon('chevron', 'chev')}</a>
    <a class="btn ghost block" href="#/care/all" style="margin-top:10px">Всички теми</a>
    ${disclaimer()}</div>`;
}

export function articleView(root, id) {
  const a = ARTICLES.find((x) => x.id === id);
  if (!a) { root.innerHTML = topbar('Няма такава тема', { back: '#/care' }); return; }
  root.innerHTML = `${topbar(CARE_CATS[a.cat], { back: '#/care' })}<div class="view prose">
    <h2 style="margin:4px 0 6px;font-size:1.35rem">${esc(a.title)}</h2>
    <div class="box info"><b>Накратко:</b> ${esc(a.summary)}</div>
    ${a.body.map((b) => `${b.h ? `<h3>${esc(b.h)}</h3>` : ''}${b.p ? `<p>${esc(b.p)}</p>` : ''}${b.list ? `<ul>${b.list.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}`).join('')}
    ${sourcesList(a.src)}
    ${disclaimer()}</div>`;
}

// ===== Календар =====
function icsFor(events, dog) {
  const fmt = (iso) => iso.replace(/-/g, '');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Kucheto v dzhoba//BG', 'CALSCALE:GREGORIAN'];
  for (const e of events) {
    const t = (e.title || EVENT_TYPES[e.type]?.label || 'Напомняне') + ' – ' + dog.name;
    lines.push('BEGIN:VEVENT', `UID:${e.id}@kucheto-v-dzhoba`, `DTSTAMP:${fmt(todayISO())}T090000Z`, `DTSTART;VALUE=DATE:${fmt(e.date)}`, `DTEND;VALUE=DATE:${fmt(addDays(e.date, 1))}`, `SUMMARY:${t.replace(/[,;]/g, ' ')}`,
      e.note ? `DESCRIPTION:${e.note.replace(/\n/g, '\\n').replace(/[,;]/g, ' ')}` : null,
      'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY', `DESCRIPTION:${t.replace(/[,;]/g, ' ')}`, 'END:VALARM', 'END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.filter(Boolean).join('\r\n');
}

function calendar(root, dog) {
  const st = { form: null };
  function render() {
    const all = store.get().events.filter((e) => e.dogId === dog.id);
    const open = all.filter((e) => !e.done).sort((a, b) => a.date.localeCompare(b.date));
    const done = all.filter((e) => e.done).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);
    const T = EVENT_TYPES;
    const row = (e) => {
      const n = daysBetween(todayISO(), e.date);
      const when = e.done ? 'направено' : n < 0 ? `пропуснато с ${-n} дни` : n === 0 ? 'днес' : `след ${n} дни`;
      return `<div class="item" style="cursor:default"><span style="color:${!e.done && n < 0 ? 'var(--danger)' : 'var(--accent)'}">${icon(T[e.type]?.icon || 'calendar')}</span>
        <span class="grow"><span class="t">${esc(e.title || T[e.type]?.label)}</span><span class="s" style="display:block">${fmtDate(e.date)} · ${when}${e.repeatDays ? ` · на всеки ${e.repeatDays} дни` : ''}</span>${e.note ? `<span class="s" style="display:block">${esc(e.note)}</span>` : ''}</span>
        ${e.done ? '' : `<button class="iconbtn" data-done="${e.id}" aria-label="Отбележи като направено" title="Направено">${icon('check')}</button>`}
        <button class="iconbtn" data-ics="${e.id}" aria-label="Добави в календара на телефона" title="В календара">${icon('download', 'sm')}</button>
        <button class="iconbtn" data-del="${e.id}" aria-label="Изтрий">${icon('trash', 'sm')}</button></div>`;
    };
    const form = st.form ? `<form id="evf" class="card">
        <h2>Ново напомняне</h2>
        <label class="f" for="et">Вид</label><select id="et">${Object.entries(T).map(([k, v]) => `<option value="${k}" ${st.form.type === k ? 'selected' : ''}>${esc(v.label)}</option>`).join('')}</select>
        <p class="hint" id="enote">${esc(T[st.form.type].note)}</p>
        <label class="f" for="ed">Дата</label><input id="ed" type="date" value="${st.form.date}" required>
        <label class="f" for="etl">Заглавие (по желание)</label><input id="etl" type="text" maxlength="60" placeholder="напр. Ваксина Нобивак DHPPi">
        <label class="f" for="er">Повтаряне след (дни)</label><input id="er" type="number" min="0" max="730" inputmode="numeric" value="${T[st.form.type].every || ''}" placeholder="без повтаряне">
        <p class="hint">Когато отбележите „направено“, следващото напомняне се създава автоматично. Интервала за лекарства и ваксини определя ветеринарят.</p>
        <label class="f" for="en">Бележка</label><input id="en" type="text" maxlength="120" placeholder="напр. продукт, клиника">
        <div class="row" style="margin-top:12px"><button class="btn primary grow" type="submit">Запази</button><button class="btn ghost" type="button" data-act="cancel">Отказ</button></div>
      </form>` : `<button class="btn primary block" data-act="add">${icon('plus', 'sm')} Добави напомняне</button>`;
    root.innerHTML = `${topbar('Грижи')}<div class="view">${tabs('calendar')}
      <div class="box info small">${icon('info', 'sm')} Записвайте датите, които ви е дал ветеринарят. С бутона ${icon('download', 'sm')} напомнянето се добавя в календара на телефона (с аларма ден преди).</div>
      ${form}
      <h3 class="section-title">Предстоящи</h3>${open.length ? open.map(row).join('') : '<div class="empty">Няма предстоящи напомняния.</div>'}
      ${open.length > 1 ? `<button class="btn ghost block" data-act="icsall">${icon('download', 'sm')} Всички в календара на телефона</button>` : ''}
      ${done.length ? `<h3 class="section-title">История</h3>${done.map(row).join('')}` : ''}
      <a class="item" href="#/care/a/vaccines"><span style="color:var(--accent)">${icon('syringe')}</span><span class="grow"><span class="t">Ваксини, обезпаразитяване, бяс – какво казват източниците</span></span>${icon('chevron', 'chev')}</a>
      ${disclaimer()}</div>`;
  }
  root.addEventListener('change', (e) => { if (e.target.id === 'et') { st.form.type = e.target.value; st.form.date = $('#ed', root).value; render(); } });
  root.addEventListener('submit', (e) => {
    e.preventDefault();
    const ev = { dogId: dog.id, type: $('#et', root).value, date: $('#ed', root).value, title: $('#etl', root).value.trim(), note: $('#en', root).value.trim(), repeatDays: Number($('#er', root).value) || null, done: false };
    store.upsertEvent(ev); st.form = null; toast('Напомнянето е добавено'); render();
  });
  root.addEventListener('click', (e) => {
    const t = e.target.closest('[data-act],[data-done],[data-del],[data-ics]');
    if (!t) return;
    const evs = store.get().events;
    if (t.dataset.act === 'add') { st.form = { type: 'rabies', date: todayISO() }; render(); }
    if (t.dataset.act === 'cancel') { st.form = null; render(); }
    if (t.dataset.act === 'icsall') download(`napomniania-${dog.name}.ics`, icsFor(evs.filter((x) => x.dogId === dog.id && !x.done), dog), 'text/calendar');
    if (t.dataset.done) {
      const ev = evs.find((x) => x.id === t.dataset.done);
      store.upsertEvent({ ...ev, done: true, doneOn: todayISO() });
      if (ev.repeatDays) { store.upsertEvent({ ...ev, id: undefined, date: addDays(todayISO() > ev.date ? todayISO() : ev.date, ev.repeatDays), done: false }); toast('Следващото напомняне е създадено'); }
      render();
    }
    if (t.dataset.del) { store.removeEvent(t.dataset.del); render(); }
    if (t.dataset.ics) { const ev = evs.find((x) => x.id === t.dataset.ics); download(`${ev.type}-${ev.date}.ics`, icsFor([ev], dog), 'text/calendar'); }
  });
  render();
}
