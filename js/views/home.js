import { esc, $, fmtDate, daysBetween, todayISO, debounce } from '../util.js';
import { icon } from '../icons.js';
import { store } from '../store.js';
import { search } from '../engine/search.js';
import { aiEnabled, askAI } from '../engine/ai.js';
import { avatar, emergencyCard, resultItem, disclaimer, sourcesList, vetCallBar } from '../components.js';
import { dogSummary, profileFlags, STAGE_LABEL, lifeStage } from '../profile.js';
import { dailyTips, EVENT_TYPES } from '../../data/care.js';
import { SOS } from '../../data/sos.js';

const QUICK = ['Може ли да яде банан?', 'Кучето повръща', 'Колко храна да давам?', 'Как да махна кърлеж?', 'Дърпа на повода', 'Страх от фойерверки'];

export function homeView(root, params) {
  const dog = store.activeDog();
  const f = profileFlags(dog);
  const st = { q: params.get('q') || '', ai: null, aiErr: null, aiLoading: false };

  function header() {
    const many = store.get().dogs.length > 1;
    return `<header class="topbar"><a class="dogchip" href="#/me" style="text-decoration:none;color:inherit">${avatar(dog)}<span class="small"><b>${esc(dog.name)}</b>${many ? ' ▾' : ''}</span></a><span class="grow"></span><a class="iconbtn" href="#/sos" aria-label="SOS" style="color:var(--danger)">${icon('sos')}</a></header>`;
  }

  function resultsHTML() {
    if (!st.q.trim()) return '';
    const r = search(st.q, dog);
    const groups = { sos: [], food: [], article: [], recipe: [] };
    r.results.forEach((x) => groups[x.type].push(x));
    const emerg = emergencyCard(r.triage.sos);
    const red = !r.triage.sos.length && r.triage.red ? `<div class="box red small">${icon('alert', 'sm')} Споменавате признак, който може да е сериозен (напр. кръв, колапс, постоянно повръщане). Ако е така – свържете се с ветеринар веднага.</div>` : '';
    const sec = (title, arr, n) => (arr.length ? `<h3 class="section-title">${title}</h3>${arr.slice(0, n).map((x) => resultItem(x, dog)).join('')}` : '');
    const none = !r.results.length ? `<div class="card flat"><b>Не намерих проверен отговор в базата.</b><p class="small muted" style="margin:6px 0 0">Опитайте с други думи (напр. „повръща“, „може ли ябълка“, „кърлеж“) или разгледайте SOS и Грижи. Ако се притеснявате – свържете се с ветеринар.</p></div>` : '';
    const ai = aiEnabled() ? aiBlock() : '';
    return `<div id="results">${emerg}${red}${sec('Първа помощ', groups.sos, 3)}${sec('Храни', groups.food, 4)}${sec('Грижи и съвети', groups.article, 3)}${sec('Рецепти', groups.recipe, 3)}${none}${ai}</div>`;
  }

  function aiBlock() {
    if (st.aiLoading) return `<div class="card"><div class="row">${icon('sparkle')}<b>Помощникът мисли…</b></div></div>`;
    if (st.aiErr) return `<div class="card flat small">${esc(st.aiErr)}</div>`;
    if (st.ai) {
      return `<div class="card"><div class="row" style="margin-bottom:6px">${icon('sparkle')}<b>Отговор на помощника</b></div>
        ${st.ai.urgent ? `<div class="box red small">${icon('alert', 'sm')} Помощникът отбелязва, че ситуацията може да е спешна – свържете се с ветеринар.</div>${vetCallBar()}` : ''}
        <div class="prose">${st.ai.answer.split(/\n+/).map((p) => `<p>${esc(p)}</p>`).join('')}</div>
        ${st.ai.sources?.length ? sourcesList(st.ai.sources) : ''}
        <p class="tiny muted">Генериран отговор само от проверената база на приложението. Не е диагноза.</p></div>`;
    }
    return `<button class="btn ghost block" data-act="ai">${icon('sparkle', 'sm')} Обясни ми по-подробно (AI)</button>`;
  }

  function tipsHTML() {
    const tips = dailyTips(dog, new Date(), f);
    const done = store.checksToday(dog.id);
    return `<div class="card"><div class="row between"><h2>Днес за ${esc(dog.name)}</h2><span class="tiny muted">${new Date().toLocaleDateString('bg-BG', { day: 'numeric', month: 'long' })}</span></div>
      ${tips.map((t) => `<button class="check ${done[t.id] ? 'done' : ''}" data-tip="${t.id}"><span class="box-ck">${done[t.id] ? icon('check', 'sm') : ''}</span><span class="t small">${esc(t.text)}</span></button>`).join('')}</div>`;
  }

  function upcomingHTML() {
    const ev = store.get().events.filter((e) => e.dogId === dog.id && !e.done).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);
    if (!ev.length) return `<a class="item" href="#/care/calendar"><span style="color:var(--accent)">${icon('calendar')}</span><span class="grow"><span class="t">Календар за профилактика</span><span class="s" style="display:block">Добавете ваксини, обезпаразитяване и прегледи</span></span>${icon('chevron', 'chev')}</a>`;
    return `<h3 class="section-title">${icon('calendar', 'sm')} Предстои</h3>${ev.map((e) => {
      const n = daysBetween(todayISO(), e.date);
      const when = n < 0 ? `пропуснато (${-n} дни)` : n === 0 ? 'днес' : n === 1 ? 'утре' : `след ${n} дни`;
      return `<a class="item" href="#/care/calendar"><span style="color:${n < 0 ? 'var(--danger)' : 'var(--accent)'}">${icon(EVENT_TYPES[e.type]?.icon || 'calendar')}</span><span class="grow"><span class="t">${esc(e.title || EVENT_TYPES[e.type]?.label)}</span><span class="s" style="display:block">${fmtDate(e.date)} · ${when}</span></span>${icon('chevron', 'chev')}</a>`;
    }).join('')}`;
  }

  function personalHTML() {
    const out = [];
    if (f.has('brachy')) out.push(['heatstroke', 'Плоскомуцунеста порода – висок риск от прегряване. Вижте признаците.']);
    if (f.has('gdv')) out.push(['gdv', 'Едро куче – научете признаците на усукан стомах.']);
    if (f.has('female_intact')) out.push(['pyometra', 'Нестерилизирана женска – признаци на пиометра.']);
    if (f.has('puppy')) out.push(['parvo', 'Кученце – кога повръщането и диарията са спешни.']);
    if (!out.length) return '';
    return `<h3 class="section-title">${icon('shield', 'sm')} Важно за ${esc(dog.name)}</h3>${out.slice(0, 2).map(([id, t]) => {
      const s = SOS.find((x) => x.id === id);
      return `<a class="item" href="#/sos/${id}"><span style="color:var(--danger)">${icon('alert')}</span><span class="grow"><span class="t">${esc(s.title)}</span><span class="s" style="display:block">${esc(t)}</span></span>${icon('chevron', 'chev')}</a>`;
    }).join('')}`;
  }

  function render() {
    const hist = store.get().history;
    root.innerHTML = `${header()}<div class="view">
      <section class="ask">
        <h2>Какво искаш да попиташ?</h2>
        <p>Пиши със свои думи – отговорите са съобразени с ${esc(dog.name)} (${esc(STAGE_LABEL[lifeStage(dog)])}).</p>
        <form class="askbox" data-act="ask"><label class="sr" for="q">Въпрос</label><input id="q" type="search" enterkeyhint="search" placeholder="напр. Може ли да яде ябълка?" value="${esc(st.q)}" autocomplete="off"><button type="submit" aria-label="Търси">${icon('search')}</button></form>
        ${st.q ? '' : `<div class="chips">${(hist.length ? hist.slice(0, 3) : []).concat(QUICK).slice(0, 6).map((q) => `<button class="chip" data-q="${esc(q)}">${esc(q)}</button>`).join('')}</div>`}
      </section>
      ${resultsHTML()}
      ${st.q ? `<button class="btn ghost block" data-act="clear" style="margin-top:8px">Нов въпрос</button>` : `${personalHTML()}${tipsHTML()}${upcomingHTML()}`}
      ${disclaimer()}
    </div>`;
  }

  const runSearch = (q) => {
    st.q = q; st.ai = null; st.aiErr = null;
    if (q.trim()) store.pushHistory(q.trim());
    history.replaceState(null, '', '#/home' + (q ? '?q=' + encodeURIComponent(q) : ''));
    render();
    $('#results', root)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  root.addEventListener('submit', (e) => { e.preventDefault(); runSearch($('#q', root).value); });
  root.addEventListener('click', async (e) => {
    const chip = e.target.closest('[data-q]');
    if (chip) { runSearch(chip.dataset.q); return; }
    const tip = e.target.closest('[data-tip]');
    if (tip) { store.toggleCheck(dog.id, tip.dataset.tip); render(); return; }
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'clear') { runSearch(''); $('#q', root)?.focus(); }
    if (act === 'ai') {
      st.aiLoading = true; render();
      try { const r = search(st.q, dog); st.ai = await askAI(st.q, dog, r.results); }
      catch (err) { st.aiErr = err.message; }
      st.aiLoading = false; render();
    }
  });
  render();
}
