import { esc, $, toast } from '../util.js';
import { icon } from '../icons.js';
import { store } from '../store.js';
import { SECTIONS, bindForm, cleanDog } from './profileForm.js';
import { logoSVG } from '../components.js';
import { dogSummary, STAGE_LABEL, lifeStage } from '../profile.js';

const STEPS = ['basics', 'age', 'breed', 'body', 'health', 'vet'];

export function onboardingView(root, { addAnother = false } = {}) {
  const st = { step: addAnother ? 1 : 0, d: { ageMode: 'exact', allergies: [], conditions: [], interests: [] }, accepted: store.get().settings.disclaimerAccepted };

  function render(focus) {
    const total = STEPS.length + 1;
    if (st.step === 0) {
      root.innerHTML = `<div class="ob"><div class="hero">${logoSVG}
        <h2>Кучето в джоба</h2>
        <p class="lead">Персонален помощник за хранене, ежедневни грижи, безопасност и профилактика на вашето куче.</p></div>
        <div class="card flat stack small">
          <div class="row">${icon('paw')}<span>Разкажете ни за кучето – съветите ще се нагодят към него.</span></div>
          <div class="row">${icon('shield')}<span>Съдържание само от ветеринарни източници, с посочени връзки.</span></div>
          <div class="row">${icon('sos')}<span>SOS и справочникът работят и без интернет.</span></div>
        </div>
        <div class="ob-actions" style="flex-direction:column"><button class="btn primary block" data-act="next">Да започваме ${icon('chevron', 'sm')}</button>
        <label class="btn ghost block" style="cursor:pointer">${icon('upload', 'sm')} Имам резервно копие<input type="file" accept="application/json,.json" class="sr" data-act="import"></label></div></div>`;
      return;
    }
    if (st.step <= STEPS.length) {
      const key = STEPS[st.step - 1];
      const S = SECTIONS[key];
      root.innerHTML = `<div class="ob">
        <div class="row between"><button class="iconbtn" data-act="back" aria-label="Назад">${icon('back')}</button><span class="small muted">Стъпка ${st.step} от ${total - 1}</span>${S.optional ? '<button class="btn sm ghost" data-act="skip">Пропусни</button>' : '<span style="width:40px"></span>'}</div>
        <div class="progress"><span style="width:${(st.step / total) * 100}%"></span></div>
        <h2>${esc(S.title)}</h2>
        <p class="lead">${esc(S.lead)}</p>
        <form class="sec" onsubmit="return false">${S.render(st.d)}</form>
        <p class="hint" id="err" role="alert" style="color:var(--danger)"></p>
        <div class="ob-actions"><button class="btn primary block" data-act="next">Напред ${icon('chevron', 'sm')}</button></div></div>`;
      bindForm($('.sec', root), st.d, (re) => { if (re) render(document.activeElement?.dataset?.f); });
      if (focus) { const el = root.querySelector(`[data-f="${focus}"]`); if (el) { el.focus(); const v = el.value; el.value = ''; el.value = v; } }
      return;
    }
    // Обобщение
    const d = cleanDog(st.d);
    root.innerHTML = `<div class="ob">
      <div class="row between"><button class="iconbtn" data-act="back" aria-label="Назад">${icon('back')}</button><span class="small muted">Последна стъпка</span><span style="width:40px"></span></div>
      <div class="progress"><span style="width:100%"></span></div>
      <h2>Готово, ${esc(d.name)} е тук! 🐾</h2>
      <div class="card"><div class="row"><span class="avatar xl">${d.photo ? `<img src="${d.photo}" alt="">` : esc(d.name.slice(0, 1))}</span><div><b>${esc(d.name)}</b><div class="small muted">${esc(dogSummary(d))}</div><div class="small">${esc(STAGE_LABEL[lifeStage(d)])}</div></div></div></div>
      <div class="card flat small">
        <b>Важно, преди да започнете</b>
        <ul style="padding-left:18px;margin:8px 0">
          <li>Приложението дава обща информация от ветеринарни източници (FEDIAF, WSAVA, MSD Veterinary Manual, PDSA, ASPCA и др.).</li>
          <li>Не поставя диагнози, не определя лекарства и дози и не замества ветеринарен лекар.</li>
          <li>При спешност – свържете се с ветеринар веднага.</li>
          <li>Данните за кучето се пазят само на това устройство.</li>
        </ul>
        <label class="row" style="gap:10px;cursor:pointer"><input type="checkbox" data-act="accept" ${st.accepted ? 'checked' : ''} style="width:22px;height:22px"> <span>Разбирам и приемам</span></label>
      </div>
      <div class="ob-actions"><button class="btn primary block" data-act="finish" ${st.accepted ? '' : 'disabled'}>Към приложението</button></div></div>`;
  }

  root.addEventListener('click', (e) => {
    const a = e.target.closest('[data-act]')?.dataset.act;
    if (!a) return;
    if (a === 'next') {
      if (st.step >= 1 && st.step <= STEPS.length) {
        const err = SECTIONS[STEPS[st.step - 1]].valid(st.d);
        if (err) { $('#err', root).textContent = err; return; }
      }
      st.step++; render(); window.scrollTo(0, 0);
    }
    if (a === 'skip') { st.step++; render(); window.scrollTo(0, 0); }
    if (a === 'back') {
      if (addAnother && st.step <= 1) { location.hash = '#/me'; return; }
      st.step = Math.max(0, st.step - 1); render();
    }
    if (a === 'finish') {
      const dog = store.upsertDog(cleanDog(st.d));
      store.setActive(dog.id);
      store.setSetting('disclaimerAccepted', true);
      toast(`Профилът на ${dog.name} е създаден`);
      location.hash = '#/home';
    }
  });
  root.addEventListener('change', async (e) => {
    if (e.target.dataset.act === 'accept') { st.accepted = e.target.checked; render(); }
    if (e.target.dataset.act === 'import' && e.target.files?.[0]) {
      try { store.importJSON(await e.target.files[0].text()); toast('Данните са възстановени'); location.hash = '#/home'; }
      catch { toast('Файлът не може да бъде прочетен'); }
    }
  });
  render();
}
