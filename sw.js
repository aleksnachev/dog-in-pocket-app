// Service worker – офлайн работа. При промяна на файловете увеличете VERSION.
const VERSION = 'kvd-0.1.0';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/app.css',
  './assets/icon.svg',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/icon-maskable-512.png',
  './js/app.js',
  './js/config.js',
  './js/util.js',
  './js/icons.js',
  './js/store.js',
  './js/profile.js',
  './js/calc.js',
  './js/personalize.js',
  './js/components.js',
  './js/engine/text.js',
  './js/engine/triage.js',
  './js/engine/search.js',
  './js/engine/ai.js',
  './js/views/onboarding.js',
  './js/views/profileForm.js',
  './js/views/home.js',
  './js/views/food.js',
  './js/views/sos.js',
  './js/views/care.js',
  './js/views/mydog.js',
  './data/sources.js',
  './data/foods.js',
  './data/sos.js',
  './data/recipes.js',
  './data/breeds.js',
  './data/care.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return; // AI заявките и външните връзки не се кешират
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
