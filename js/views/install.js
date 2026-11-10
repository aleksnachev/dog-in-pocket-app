import { esc, toast } from '../util.js';
import { icon } from '../icons.js';
import { logoSVG } from '../components.js';
import { platform, canPrompt, promptInstall, onInstallChange, isStandalone, dismissInstall } from '../install.js';
import { store } from '../store.js';

const shareIcon = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-5px"><path d="M12 3v12M8 7l4-4 4 4"/><path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1"/></svg>`;
const plusBox = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" style="vertical-align:-5px"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 8v8M8 12h8"/></svg>`;
const dots = '<b style="letter-spacing:2px">⋮</b>';

const step = (n, html) => `<li class="row" style="align-items:flex-start;gap:12px;margin:12px 0"><span class="pill v-ok" style="min-width:28px;justify-content:center">${n}</span><span>${html}</span></li>`;

export function installView(root) {
  const p = platform();
  const url = location.href.split('#')[0];
  const firstRun = !store.get().dogs.length;

  function body() {
    if (isStandalone()) {
      return `<div class="box do"><b>Приложението е инсталирано ✔</b><br>Отваряте го от иконата на началния екран.</div>`;
    }
    if (p.inApp) {
      const intent = `intent://${url.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end`;
      return `<div class="box red"><b>Отворили сте линка в приложение (Facebook, Instagram, Messenger…).</b><br>Оттук „Кучето в джоба“ не може да се инсталира. Отворете го в ${p.ios ? 'Safari' : 'Chrome'}:</div>
        <ol class="list">${p.ios
          ? step(1, `Натиснете ${dots} или ${shareIcon} в ъгъла на екрана.`) + step(2, 'Изберете <b>„Отвори в Safari“</b> (или „Отвори в браузър“).') + step(3, 'В Safari ще видите указанията за инсталиране.')
          : step(1, `Натиснете бутона по-долу или ${dots} горе вдясно → <b>„Отвори в Chrome“</b>.`) + step(2, 'В Chrome натиснете „Инсталирай“.')}</ol>
        ${p.android ? `<a class="btn primary block" href="${esc(intent)}">Отвори в Chrome</a>` : ''}
        <button class="btn ghost block" data-act="copy" style="margin-top:8px">${icon('link', 'sm')} Копирай линка</button>`;
    }
    if (p.ios) {
      return `${p.iosOtherBrowser ? '<div class="box info small">Най-лесно е в <b>Safari</b>. Ако използвате Chrome на iPhone, стъпките са същите – бутонът „Сподели“ е в адресната лента.</div>' : ''}<ol class="list">
        ${step(1, `Натиснете бутона <b>„Сподели“</b> ${shareIcon} (в долната лента на Safari; на iPad – горе).`)}
        ${step(2, `Превъртете надолу и изберете <b>„Добави към началния екран“</b> ${plusBox}.`)}
        ${step(3, 'Натиснете <b>„Добави“</b> горе вдясно.')}
        ${step(4, 'Затворете Safari и отворете <b>„Кучето в джоба“</b> от иконата на началния екран.')}
      </ol>
      <div class="box info small"><b>Важно за iPhone:</b> приложението от началния екран пази данните отделно от Safari. Затова първо го инсталирайте и <b>чак тогава</b> въведете профила на кучето.</div>`;
    }
    const btn = canPrompt() ? `<button class="btn primary block" data-act="install">${icon('download', 'sm')} Инсталирай приложението</button>` : '';
    if (p.android) {
      return `${btn}
        <ol class="list">${canPrompt()
          ? step(1, 'Натиснете <b>„Инсталирай приложението“</b> и потвърдете.') + step(2, 'Иконата <b>„Кучето в джоба“</b> ще се появи на началния екран.')
          : p.samsung
            ? step(1, 'Натиснете менюто <b>☰</b> долу вдясно.') + step(2, 'Изберете <b>„Добави страница към“ → „Начален екран“</b>.') + step(3, 'Отворете приложението от иконата.')
            : step(1, `Натиснете менюто ${dots} горе вдясно в Chrome.`) + step(2, 'Изберете <b>„Инсталиране на приложението“</b> или <b>„Добавяне към началния екран“</b>.') + step(3, 'Потвърдете и отворете от иконата.')}</ol>`;
    }
    return `${btn}<div class="box info small">„Кучето в джоба“ работи и на компютър, но е направено за телефон. Отворете същия линк на телефона си (или сканирайте QR кода от PDF-а) и го добавете към началния екран.</div>`;
  }

  function render() {
    root.innerHTML = `<div class="ob">
      <div class="hero" style="padding-top:12px">${logoSVG}<h2>Инсталирай на телефона</h2>
      <p class="lead">Така „Кучето в джоба“ се отваря с една икона като обикновено приложение и работи и <b>без интернет</b>.</p></div>
      <div class="card">${body()}</div>
      <div class="ob-actions" style="flex-direction:column">
        ${isStandalone() ? `<a class="btn primary block" href="#/home">Към приложението</a>` : `<button class="btn ghost block" data-act="skip">${firstRun ? 'Продължи в браузъра засега' : 'Назад към приложението'}</button>`}
      </div>
      <p class="hint" style="text-align:center">Не изисква App Store или Google Play и не заема почти никакво място.</p></div>`;
  }

  root.addEventListener('click', async (e) => {
    const a = e.target.closest('[data-act]')?.dataset.act;
    if (a === 'install') { const r = await promptInstall(); if (r === 'accepted') toast('Инсталирано! Отворете го от началния екран.'); render(); }
    if (a === 'copy') { try { await navigator.clipboard.writeText(url); toast('Линкът е копиран'); } catch { prompt('Копирайте линка:', url); } }
    if (a === 'skip') { dismissInstall(); location.hash = store.get().dogs.length ? '#/home' : '#/onboarding'; }
  });
  const off = onInstallChange(() => { if (root.isConnected) render(); else off(); });
  render();
}
