// Инсталиране на приложението на началния екран (PWA).
// Android/Chrome/Edge/Samsung: истински бутон „Инсталирай“ (beforeinstallprompt).
// iPhone/iPad: Apple не позволява бутон – показваме стъпките (Сподели → Добави към началния екран).
// Вградени браузъри (Facebook, Instagram, Messenger, TikTok…): не могат да инсталират – молим да се отвори в Safari/Chrome.

let deferred = null;
const listeners = new Set();
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; listeners.forEach((l) => l()); });
window.addEventListener('appinstalled', () => { deferred = null; try { localStorage.setItem('kvd-installed', '1'); } catch { /* */ } listeners.forEach((l) => l()); });

export const onInstallChange = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

export function isStandalone() {
  return window.matchMedia?.('(display-mode: standalone)').matches || window.matchMedia?.('(display-mode: fullscreen)').matches || window.navigator.standalone === true;
}

export function platform() {
  const ua = navigator.userAgent || '';
  const ios = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const inApp = /FBAN|FBAV|FB_IAB|FBIOS|Instagram|Messenger|MessengerForiOS|TikTok|musical_ly|Line\/|Twitter|Snapchat|Viber/i.test(ua);
  const android = /Android/i.test(ua);
  const iosOtherBrowser = ios && /CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua);
  const samsung = /SamsungBrowser/i.test(ua);
  return { ios, android, inApp, iosOtherBrowser, samsung, desktop: !ios && !android };
}

export const canPrompt = () => Boolean(deferred);

export async function promptInstall() {
  if (!deferred) return 'unavailable';
  deferred.prompt();
  const { outcome } = await deferred.userChoice;
  deferred = null;
  listeners.forEach((l) => l());
  return outcome; // 'accepted' | 'dismissed'
}

export function wasInstalled() { try { return localStorage.getItem('kvd-installed') === '1'; } catch { return false; } }
export function installDismissed() { try { return localStorage.getItem('kvd-install-skip') === '1'; } catch { return false; } }
export function dismissInstall() { try { localStorage.setItem('kvd-install-skip', '1'); } catch { /* */ } }
