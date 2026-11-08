// Кучето в джоба – вход и маршрутизация (hash router)
import { store } from './store.js';
import { icon } from './icons.js';
import { onboardingView } from './views/onboarding.js';
import { homeView } from './views/home.js';
import { foodView, foodItemView, recipeView } from './views/food.js';
import { sosView, sosItemView, vetNoteView } from './views/sos.js';
import { careView, articleView } from './views/care.js';
import { myDogView, editView, settingsView, aboutView } from './views/mydog.js';
import { installView } from './views/install.js';
import { isStandalone, installDismissed } from './install.js';

const theme = localStorage.getItem('theme');
if (theme) document.documentElement.dataset.theme = theme;

const app = document.getElementById('app');
const nav = document.getElementById('nav');

const TABS = [
  ['home', 'Начало', 'home'],
  ['food', 'Хранене', 'bowl'],
  ['sos', 'SOS', 'sos'],
  ['care', 'Грижи', 'care'],
  ['me', 'Моето куче', 'paw'],
];

function renderNav(active, hidden) {
  nav.hidden = hidden;
  nav.innerHTML = `<div class="nav-inner">${TABS.map(([k, l, ic]) => `<a href="#/${k}" class="${active === k ? 'active' : ''} ${k === 'sos' ? 'sos-tab' : ''}" ${active === k ? 'aria-current="page"' : ''}>${icon(ic)}<span>${l}</span></a>`).join('')}</div>`;
}

function parse() {
  const h = location.hash.replace(/^#\/?/, '') || 'home';
  const [path, qs] = h.split('?');
  return { parts: path.split('/').filter(Boolean), params: new URLSearchParams(qs || '') };
}

function route() {
  const { parts, params } = parse();
  const hasDog = store.get().dogs.length > 0;
  const view = document.createElement('main');
  view.id = 'view';
  const [a, b, c] = parts;

  // Първо отваряне в браузъра: предлагаме инсталиране преди профила (на iPhone иконата има собствена памет)
  if (!hasDog && !isStandalone() && !installDismissed() && a !== 'install') { location.replace('#/install'); return; }
  if (!hasDog && a !== 'onboarding' && a !== 'install') { location.replace('#/onboarding'); return; }

  let tab = a;
  if (a === 'install') { renderNav(null, !hasDog); installView(view); if (hasDog) renderNav('me', false); }
  else if (a === 'onboarding') { renderNav(null, true); onboardingView(view, { addAnother: b === 'add' && hasDog }); }
  else if (a === 'food') {
    if (b === 'item') foodItemView(view, c);
    else if (b === 'recipe') recipeView(view, c);
    else foodView(view, params, b || 'search');
  } else if (a === 'sos') {
    if (b === 'vetnote') vetNoteView(view, params);
    else if (b) sosItemView(view, b);
    else sosView(view);
  } else if (a === 'care') {
    if (b === 'a') articleView(view, c);
    else careView(view, params, b || 'for');
  } else if (a === 'me') {
    if (b === 'edit') editView(view, params); else myDogView(view);
  } else if (a === 'settings') { tab = 'me'; settingsView(view); }
  else if (a === 'about') { tab = 'me'; aboutView(view); }
  else { tab = 'home'; homeView(view, params); }

  if (a !== 'onboarding' && a !== 'install') renderNav(tab, false);
  app.replaceChildren(view);
  if (!(a === 'home' && params.get('q'))) window.scrollTo(0, 0);
}

window.addEventListener('hashchange', route);
route();

// Офлайн режим (service worker) – работи само през https:// или localhost
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch((e) => console.warn('SW', e)));
}
