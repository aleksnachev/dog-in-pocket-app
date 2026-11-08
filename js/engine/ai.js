// Клиент към (по избор) AI сървъра. Ако не е настроен адрес – приложението работи само с локалното търсене.
// AI-ят НЕ получава името на кучето, а само обобщен профил и откъси от проверената база.
import { store } from '../store.js';
import { profileForAI } from '../profile.js';
import { contextFor } from './search.js';
import { CONFIG } from '../config.js';

export function aiEnabled() {
  const s = store.get().settings;
  return Boolean(s.aiEndpoint || CONFIG.aiEndpoint) && navigator.onLine;
}

export async function askAI(question, dog, results) {
  const s = store.get().settings;
  const endpoint = s.aiEndpoint || CONFIG.aiEndpoint;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Access-Code': s.accessCode || '' },
    body: JSON.stringify({ question: String(question).slice(0, 600), profile: dog ? profileForAI(dog) : null, context: contextFor(results, 6) }),
  });
  if (res.status === 429) throw new Error('Достигнат е лимитът на въпроси към AI за днес.');
  if (res.status === 401) throw new Error('Невалиден код за достъп до AI.');
  if (!res.ok) throw new Error('AI помощникът не е достъпен в момента.');
  return res.json(); // { answer, citations: [ids], urgent: bool }
}
