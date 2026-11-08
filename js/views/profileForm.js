// Полета на профила – използват се и при първото отваряне, и при редакция.
import { esc, $, $$, resizeImage, todayISO } from '../util.js';
import { icon } from '../icons.js';
import { BREEDS, SIZE_CLASSES } from '../../data/breeds.js';
import { ALLERGENS, CONDITIONS, ACTIVITY, FOOD_TYPES, INTERESTS, lifeStage } from '../profile.js';
import { avatar } from '../components.js';

const pressed = (b) => `aria-pressed="${b ? 'true' : 'false'}"`;

const BCS_TEXT = {
  1: 'Много слабо: ребра, гръбнак и тазови кости се виждат отдалеч; няма мазнина; загуба на мускули.',
  2: 'Слабо: ребрата и костите се виждат лесно; не се напипва мазнина.',
  3: 'Леко слабо: ребрата се напипват лесно и може да се виждат; ясна талия.',
  4: 'Идеално (по-слабичко): ребрата се напипват лесно с малко мазнина; талия и прибран корем.',
  5: 'Идеално: ребрата се напипват без излишна мазнина; талия зад ребрата; прибран корем.',
  6: 'Леко над идеалното: ребрата се напипват с малко повече мазнина; талията се вижда, но не ясно.',
  7: 'Наднормено: ребрата се напипват трудно; мазнини по кръста и опашката; талия почти няма.',
  8: 'Затлъстяване: ребрата не се напипват без силен натиск; няма талия.',
  9: 'Силно затлъстяване: големи мазнини по гърдите, гръбнака, опашката, шията; подут корем.',
};

export const SECTIONS = {
  basics: {
    title: 'Как се казва?', lead: 'Започваме с основното. Всичко остава само на вашия телефон.',
    render: (d) => `
      <div class="row" style="gap:14px;margin-top:8px">
        <label class="avatar-pick" style="cursor:pointer">${avatar(d, 'xl')}<input type="file" accept="image/*" data-f="photo" class="sr"></label>
        <div class="grow"><label class="f" for="f-name" style="margin-top:0">Име *</label>
        <input id="f-name" type="text" data-f="name" value="${esc(d.name || '')}" placeholder="напр. Рони" autocomplete="off" maxlength="30"></div>
      </div>
      <p class="hint">Докоснете кръга, за да добавите снимка (по желание).</p>
      <label class="f">Пол *</label>
      <div class="chips"><button type="button" class="chip" data-set="sex" data-v="m" ${pressed(d.sex === 'm')}>Мъжко</button><button type="button" class="chip" data-set="sex" data-v="f" ${pressed(d.sex === 'f')}>Женско</button></div>
      <label class="f">Кастрирано / стерилизирано ли е? *</label>
      <div class="chips"><button type="button" class="chip" data-set="neutered" data-v="yes" ${pressed(d.neutered === 'yes')}>Да</button><button type="button" class="chip" data-set="neutered" data-v="no" ${pressed(d.neutered === 'no')}>Не</button><button type="button" class="chip" data-set="neutered" data-v="unknown" ${pressed(d.neutered === 'unknown')}>Не знам</button></div>
      <p class="hint">Влияе на калориите и на темите, които ви показваме (напр. пиометра при нестерилизирани женски).</p>`,
    valid: (d) => (d.name?.trim() && d.sex && d.neutered ? null : 'Попълнете име, пол и дали е кастрирано.'),
  },
  age: {
    title: 'На колко години е?', lead: 'Възрастта определя дали е кученце, възрастно или в напреднала възраст – и как се изчислява храната.',
    render: (d) => `
      <div class="seg" role="tablist" style="margin-top:10px"><button type="button" class="${d.ageMode !== 'approx' ? 'on' : ''}" data-set="ageMode" data-v="exact">Знам датата</button><button type="button" class="${d.ageMode === 'approx' ? 'on' : ''}" data-set="ageMode" data-v="approx">Приблизително</button></div>
      ${d.ageMode === 'approx' ? `
        <div class="row" style="margin-top:12px"><div class="grow"><label class="f">Години</label><input type="number" min="0" max="25" inputmode="numeric" data-f="approxY" value="${esc(d.approxY ?? '')}"></div>
        <div class="grow"><label class="f">Месеци</label><input type="number" min="0" max="11" inputmode="numeric" data-f="approxM" value="${esc(d.approxM ?? '')}"></div></div>
        <p class="hint">Ако е осиновено и не знаете точно – ветеринарят може да прецени по зъбите.</p>`
      : `<label class="f" for="f-birth">Дата на раждане *</label><input id="f-birth" type="date" data-f="birthDate" max="${todayISO()}" value="${esc(d.birthDate || '')}">`}`,
    valid: (d) => (d.birthDate ? null : 'Въведете дата на раждане или приблизителна възраст.'),
  },
  breed: {
    title: 'Каква порода е?', lead: 'Не е задължително – ако е смесена порода или не знаете, ще използваме размера.',
    render: (d) => {
      const q = (d._breedQ || '').toLowerCase();
      const list = BREEDS.filter((b) => !q || b.name.toLowerCase().includes(q) || b.aliases.some((a) => a.includes(q))).slice(0, q ? 12 : 8);
      return `
      <div class="chips" style="margin-top:10px"><button type="button" class="chip" data-set="breedKnown" data-v="yes" ${pressed(d.breedKnown === 'yes')}>Знам породата</button><button type="button" class="chip" data-set="breedKnown" data-v="no" ${pressed(d.breedKnown === 'no')}>Смесена / не знам</button></div>
      ${d.breedKnown === 'yes' ? `
        <div class="searchbar" style="margin-top:12px">${icon('search', 'sm')}<input type="search" data-f="_breedQ" value="${esc(d._breedQ || '')}" placeholder="Търси порода…" autocomplete="off"></div>
        <div class="choice" style="margin-top:8px">${list.map((b) => `<button type="button" data-set="breedId" data-v="${b.id}" ${pressed(d.breedId === b.id)}><span class="t">${esc(b.name)}</span><span class="s">${SIZE_CLASSES[b.size].label}</span></button>`).join('')}</div>
        <p class="hint">Няма я в списъка? Изберете „Смесена / не знам“ и посочете размера – ще добавяме още породи.</p>` : ''}
      ${d.breedKnown === 'no' ? `
        <label class="f">Какъв е (или ще бъде) размерът като възрастно? *</label>
        <div class="choice">${Object.entries(SIZE_CLASSES).map(([k, s]) => `<button type="button" data-set="expectedAdultSize" data-v="${k}" ${pressed(d.expectedAdultSize === k)}><span class="t">${esc(s.label)}</span></button>`).join('')}</div>
        <label class="f" for="f-breedtext">Ако знаете смеската (по желание)</label><input id="f-breedtext" type="text" data-f="breedText" value="${esc(d.breedText || '')}" placeholder="напр. смес с овчарка" maxlength="40">` : ''}
      ${lifeStage(d) === 'puppy' ? `<label class="f" for="f-adultw">Очаквано тегло като пораснало (кг)</label><input id="f-adultw" type="text" inputmode="decimal" autocomplete="off" data-f="expectedAdultWeight" value="${esc(d.expectedAdultWeight || '')}" placeholder="по желание – иначе ползваме средно за размера">
        <p class="hint">Нужно за изчисляване на храната на кученцето (FEDIAF). Развъдчикът или ветеринарят могат да подскажат.</p>` : ''}`;
    },
    valid: (d) => ((d.breedKnown === 'yes' && d.breedId) || (d.breedKnown === 'no' && d.expectedAdultSize) ? null : 'Изберете порода или размер.'),
  },
  body: {
    title: 'Тегло и активност', lead: 'С тях изчисляваме ориентировъчните калории и лимита за лакомства.',
    render: (d) => `
      <label class="f" for="f-w">Тегло сега (кг) *</label>
      <input id="f-w" type="text" inputmode="decimal" autocomplete="off" data-f="weight" value="${esc(d.weight || '')}" placeholder="напр. 12,5">
      <label class="f">Телесна форма (по желание)</label>
      <p class="hint" style="margin-top:0">Огледайте и опипайте кучето – скала 1–9 на WSAVA; идеалното е 4–5.</p>
      <div class="bcs-row">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<button type="button" class="${n === 4 || n === 5 ? 'ideal' : ''}" data-set="bcs" data-v="${n}" data-num="1" ${pressed(Number(d.bcs) === n)}>${n}</button>`).join('')}</div>
      <p class="hint" id="bcs-text">${d.bcs ? esc(BCS_TEXT[d.bcs]) : 'Не сте сигурни? Пропуснете – може да го попълните после.'}</p>
      <label class="f">Колко е активно? *</label>
      <div class="choice">${Object.entries(ACTIVITY).map(([k, a]) => `<button type="button" data-set="activity" data-v="${k}" ${pressed(d.activity === k)}><span class="t">${esc(a.label)}</span><span class="s">${esc(a.hint)}</span></button>`).join('')}</div>`,
    valid: (d) => (Number(d.weight) > 0 && d.activity ? null : 'Въведете тегло и активност.'),
  },
  health: {
    title: 'Хранене и здраве', lead: 'По желание, но прави отговорите много по-точни: скриваме неподходящите храни и рецепти.', optional: true,
    render: (d) => `
      <label class="f">С какво се храни основно?</label>
      <div class="chips">${Object.entries(FOOD_TYPES).map(([k, v]) => `<button type="button" class="chip" data-set="foodType" data-v="${k}" ${pressed(d.foodType === k)}>${esc(v)}</button>`).join('')}</div>
      <label class="f" for="f-kcal">Калории в храната (ккал на кг)</label>
      <input id="f-kcal" type="number" min="500" max="6000" inputmode="numeric" data-f="foodKcalPerKg" value="${esc(d.foodKcalPerKg || '')}" placeholder="от етикета, напр. 3600">
      <p class="hint">Пише се на опаковката като „енергийна стойност“ / „метаболизируема енергия“. Ако е дадено за 100 г – умножете по 10. С него изчисляваме грамовете.</p>
      <label class="f">Известни алергии / непоносимости</label>
      <div class="chips">${Object.entries(ALLERGENS).map(([k, v]) => `<button type="button" class="chip" data-toggle="allergies" data-v="${k}" ${pressed((d.allergies || []).includes(k))}>${esc(v)}</button>`).join('')}</div>
      <p class="hint">Само установени (от ветеринар или проба с диета) – не ги „гадаем“.</p>
      <label class="f">Диагностицирани състояния</label>
      <div class="chips">${Object.entries(CONDITIONS).map(([k, v]) => `<button type="button" class="chip" data-toggle="conditions" data-v="${k}" ${pressed((d.conditions || []).includes(k))}>${esc(v)}</button>`).join('')}</div>
      <p class="hint">Това не е медицинска оценка. При тези състояния приложението ще ви насочва към ветеринаря за храненето.</p>
      ${d.sex === 'f' && d.neutered !== 'yes' ? `<label class="f">Бременна или кърми ли?</label>
      <div class="chips"><button type="button" class="chip" data-set="repro" data-v="none" ${pressed(!d.repro || d.repro === 'none')}>Не</button><button type="button" class="chip" data-set="repro" data-v="pregnant" ${pressed(d.repro === 'pregnant')}>Бременна</button><button type="button" class="chip" data-set="repro" data-v="lactating" ${pressed(d.repro === 'lactating')}>Кърми</button></div>` : ''}`,
    valid: () => null,
  },
  vet: {
    title: 'Ветеринар и интереси', lead: 'Телефонът на ветеринаря стои винаги под ръка в SOS. По желание.', optional: true,
    render: (d) => `
      <label class="f" for="f-vetn">Ветеринарен лекар / клиника</label><input id="f-vetn" type="text" data-f="vetName" value="${esc(d.vetName || '')}" placeholder="напр. д-р Иванова" maxlength="40">
      <label class="f" for="f-vetp">Телефон</label><input id="f-vetp" type="tel" data-f="vetPhone" value="${esc(d.vetPhone || '')}" placeholder="+359…" inputmode="tel">
      <label class="f" for="f-ern">Денонощна клиника (по желание)</label><input id="f-ern" type="text" data-f="erName" value="${esc(d.erName || '')}" maxlength="40">
      <label class="f" for="f-erp">Телефон на денонощната клиника</label><input id="f-erp" type="tel" data-f="erPhone" value="${esc(d.erPhone || '')}" inputmode="tel">
      <label class="f" for="f-city">Град (по желание)</label><input id="f-city" type="text" data-f="city" value="${esc(d.city || '')}" maxlength="30">
      <label class="f">Какво ви интересува най-много?</label>
      <div class="chips">${Object.entries(INTERESTS).map(([k, v]) => `<button type="button" class="chip" data-toggle="interests" data-v="${k}" ${pressed((d.interests || []).includes(k))}>${esc(v)}</button>`).join('')}</div>`,
    valid: () => null,
  },
};

function syncAge(d) {
  if (d.ageMode === 'approx') {
    const y = Number(d.approxY) || 0, m = Number(d.approxM) || 0;
    if (y || m) {
      const dt = new Date(); dt.setMonth(dt.getMonth() - (y * 12 + m));
      d.birthDate = dt.toISOString().slice(0, 10); d.birthApprox = true;
    }
  } else d.birthApprox = false;
}

// Свързва събитията за дадена секция. onChange(rerender:boolean)
export function bindForm(root, d, onChange) {
  root.addEventListener('input', (e) => {
    const f = e.target.dataset.f;
    if (!f || e.target.type === 'file') return;
    let v = e.target.value;
    if (['weight', 'expectedAdultWeight'].includes(f)) v = v.replace(',', '.');
    d[f] = v;
    if (f === 'approxY' || f === 'approxM' || f === 'birthDate') syncAge(d);
    onChange(f === '_breedQ');
  });
  root.addEventListener('change', async (e) => {
    if (e.target.dataset.f === 'photo' && e.target.files?.[0]) {
      try { d.photo = await resizeImage(e.target.files[0]); onChange(true); } catch { /* игнорираме */ }
    }
  });
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-set],[data-toggle]');
    if (!b || !root.contains(b)) return;
    if (b.dataset.set) {
      const k = b.dataset.set; let v = b.dataset.v;
      if (b.dataset.num) v = Number(v);
      d[k] = v;
      if (k === 'breedKnown' && v === 'no') d.breedId = null;
      if (k === 'breedKnown' && v === 'yes') d.expectedAdultSize = null;
      if (k === 'ageMode') syncAge(d);
    } else {
      const k = b.dataset.toggle; const arr = d[k] || (d[k] = []);
      const i = arr.indexOf(b.dataset.v); if (i >= 0) arr.splice(i, 1); else arr.push(b.dataset.v);
    }
    onChange(true);
  });
}

export function cleanDog(d) {
  const out = { ...d };
  delete out._breedQ;
  out.weight = Number(out.weight) || null;
  out.expectedAdultWeight = Number(out.expectedAdultWeight) || null;
  out.foodKcalPerKg = Number(out.foodKcalPerKg) || null;
  out.bcs = Number(out.bcs) || null;
  return out;
}
