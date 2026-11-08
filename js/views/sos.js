import { esc, $, fmtDate, toast } from '../util.js';
import { icon } from '../icons.js';
import { store } from '../store.js';
import { SOS, SOS_CATS } from '../../data/sos.js';
import { topbar, sourcesList, disclaimer, vetCallBar } from '../components.js';
import { tokens, phraseScore, wordMatch } from '../engine/text.js';
import { triage } from '../engine/triage.js';
import { profileBoost } from '../personalize.js';

const URG = { now: 'Веднага към ветеринар', today: 'Свържете се с ветеринар днес', watch: 'Наблюдавайте; при влошаване – ветеринар' };

function score(s, q) {
  let best = 0;
  for (const a of [s.title, ...s.aliases]) best = Math.max(best, phraseScore(tokens(a), q), phraseScore(q, tokens(a)) * 0.8);
  let body = 0; const words = tokens([s.intro, ...(s.signs || [])].join(' '));
  for (const w of q) if (words.some((b) => wordMatch(w, b) >= 1.6)) body++;
  return best * 10 + body;
}

export function sosView(root) {
  const dog = store.activeDog();
  const st = { q: '' };
  function list() {
    const q = tokens(st.q);
    if (q.length) {
      const tri = triage(st.q).sos;
      const res = SOS.map((s) => ({ s, sc: score(s, q) + (tri.includes(s.id) ? 50 : 0) })).filter((x) => x.sc > 0).sort((a, b) => b.sc - a.sc);
      if (!res.length) return `<div class="empty">Няма тема с тези думи. Опитайте „повръща“, „кърви“, „изяде“, „кърлеж“…<br><b>При съмнение – обадете се на ветеринар.</b></div>`;
      return res.map(({ s }) => row(s)).join('');
    }
    const pinned = SOS.filter((s) => profileBoost(s, dog));
    return `${pinned.length ? `<h3 class="section-title">${icon('shield', 'sm')} Особено важно за ${esc(dog.name)}</h3>${pinned.map(row).join('')}` : ''}
      ${Object.entries(SOS_CATS).map(([k, label]) => `<h3 class="section-title">${esc(label)}</h3>${SOS.filter((s) => s.cat === k).map(row).join('')}`).join('')}`;
  }
  const row = (s) => `<a class="item" href="#/sos/${s.id}"><span class="dot" style="background:${s.urgency === 'now' ? 'var(--danger)' : s.urgency === 'today' ? 'var(--no)' : 'var(--care)'}"></span><span class="grow"><span class="t">${esc(s.title)}</span><span class="s urg ${s.urgency}" style="display:block">${URG[s.urgency]}</span></span>${icon('chevron', 'chev')}</a>`;
  root.innerHTML = `${topbar('SOS – първа помощ')}<div class="view">
    <div class="emergency" style="margin-top:4px"><h3>${icon('phone')} При спешност – обадете се</h3>${vetCallBar()}</div>
    <div class="searchbar">${icon('search', 'sm')}<input id="sq" type="search" placeholder="Какво се случи? напр. „изяде шоколад“" autocomplete="off" aria-label="Търси проблем"></div>
    <p class="tiny muted" style="margin:6px 2px">Работи и без интернет. Търси само в проверените теми.</p>
    <a class="item" href="#/sos/vetnote"><span style="color:var(--accent)">${icon('note')}</span><span class="grow"><span class="t">Подготви информация за ветеринаря</span><span class="s" style="display:block">Кога започна, какво видяхте, какво е изяло</span></span>${icon('chevron', 'chev')}</a>
    <div id="sl">${list()}</div>${disclaimer()}</div>`;
  root.addEventListener('input', (e) => { if (e.target.id === 'sq') { st.q = e.target.value; $('#sl', root).innerHTML = list(); } });
}

export function sosItemView(root, id) {
  const s = SOS.find((x) => x.id === id);
  if (!s) { root.innerHTML = topbar('Няма такава тема', { back: '#/sos' }); return; }
  const box = (cls, title, arr) => (arr?.length ? `<div class="box ${cls}"><h4>${title}</h4><ul>${arr.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>` : '');
  root.innerHTML = `${topbar('SOS', { back: '#/sos' })}<div class="view">
    <span class="urg ${s.urgency}">${URG[s.urgency]}</span>
    <h2 style="margin:4px 0 8px;font-size:1.35rem">${esc(s.title)}</h2>
    ${s.intro ? `<p style="margin:0 0 8px">${esc(s.intro)}</p>` : ''}
    ${s.urgency === 'now' ? `<div class="emergency">${vetCallBar()}</div>` : ''}
    ${box('do', '✅ Какво да направите сега', s.doNow)}
    ${box('dont', '⛔ Какво да НЕ правите', s.dont)}
    ${box('info', 'Признаци', s.signs)}
    ${box('red', '🚨 Веднага към ветеринар, ако', s.redFlags)}
    ${s.vet ? `<div class="box info"><b>Кога към ветеринар:</b> ${esc(s.vet)}</div>` : ''}
    ${s.urgency !== 'now' ? `<div class="card flat small"><b>Ако не се подобрява или се влошава – свържете се с ветеринар.</b>${vetCallBar()}</div>` : ''}
    <a class="item" href="#/sos/vetnote?topic=${s.id}"><span style="color:var(--accent)">${icon('note')}</span><span class="grow"><span class="t">Запиши информация за ветеринаря</span></span>${icon('chevron', 'chev')}</a>
    ${sourcesList(s.src)}
    ${disclaimer()}</div>`;
}

export function vetNoteView(root, params) {
  const dog = store.activeDog();
  const topic = SOS.find((s) => s.id === params.get('topic'));
  const notes = store.get().vetNotes.filter((n) => n.dogId === dog.id);
  const now = new Date();
  const local = new Date(now - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  root.innerHTML = `${topbar('За ветеринаря', { back: topic ? '#/sos/' + topic.id : '#/sos' })}<div class="view">
    <p class="small muted">Попълнете бързо – ще ви помогне да разкажете точно, когато се обадите или отидете. Не поставя диагноза.</p>
    <form id="vn" class="card">
      <label class="f" for="v1">Какво се случи?</label><textarea id="v1" placeholder="напр. повърна 3 пъти, отпаднало е">${topic ? esc(topic.title) + ': ' : ''}</textarea>
      <label class="f" for="v2">Кога започна?</label><input id="v2" type="datetime-local" value="${local}">
      <label class="f" for="v3">Изяде ли нещо? Какво и колко?</label><input id="v3" type="text" placeholder="напр. ~50 г черен шоколад, опаковката е у мен">
      <label class="f" for="v4">Други наблюдения</label><textarea id="v4" placeholder="пие ли вода, ходи ли по нужда, венците бледи ли са…"></textarea>
      <p class="hint">Снимка на опаковката или на повърнатото/изпражненията – направете я с камерата на телефона и я покажете на ветеринаря.</p>
      <button class="btn primary block" type="submit" style="margin-top:12px">${icon('check', 'sm')} Запази</button>
    </form>
    ${notes.length ? `<h3 class="section-title">Предишни записи</h3>${notes.map((n) => `<div class="card flat"><div class="row between"><b class="small">${fmtDate(n.date)}</b><span><button class="iconbtn" data-share="${n.id}" aria-label="Сподели">${icon('share', 'sm')}</button><button class="iconbtn" data-del="${n.id}" aria-label="Изтрий">${icon('trash', 'sm')}</button></span></div><pre style="white-space:pre-wrap;font:inherit;margin:4px 0 0" class="small">${esc(n.text)}</pre></div>`).join('')}` : ''}
    </div>`;
  root.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = (id) => $('#' + id, root).value.trim();
    const when = v('v2') ? new Date(v('v2')).toLocaleString('bg-BG') : '';
    const text = [`Куче: ${dog.name}${dog.weight ? `, ${dog.weight} кг` : ''}`, v('v1') && `Какво: ${v('v1')}`, when && `Начало: ${when}`, v('v3') && `Изядено: ${v('v3')}`, v('v4') && `Наблюдения: ${v('v4')}`].filter(Boolean).join('\n');
    store.addNote(dog.id, text, 'vetNotes');
    toast('Записано');
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
  root.addEventListener('click', async (e) => {
    const del = e.target.closest('[data-del]');
    if (del) { store.removeNote(del.dataset.del, 'vetNotes'); del.closest('.card').remove(); }
    const sh = e.target.closest('[data-share]');
    if (sh) {
      const n = store.get().vetNotes.find((x) => x.id === sh.dataset.share);
      try { if (navigator.share) await navigator.share({ text: n.text }); else { await navigator.clipboard.writeText(n.text); toast('Копирано'); } } catch { /* отказано */ }
    }
  });
}
