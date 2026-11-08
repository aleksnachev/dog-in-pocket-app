// Локално съхранение (localStorage). Данните остават само на устройството.
import { uid, todayISO } from './util.js';

const KEY = 'kucheto-v-dzhoba:v1';

const empty = () => ({
  version: 1,
  dogs: [],
  activeId: null,
  events: [],       // {id, dogId, type, date, title, note, done, repeatDays}
  weights: {},      // dogId -> [{date, kg}]
  notes: [],        // {id, dogId, date, text}
  vetNotes: [],     // бележки „за ветеринаря“
  checks: {},       // 'YYYY-MM-DD:dogId' -> {tipId: true}
  history: [],      // последни въпроси
  settings: { aiEndpoint: '', accessCode: '', disclaimerAccepted: false },
});

let state = load();
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    return { ...empty(), ...JSON.parse(raw) };
  } catch (e) {
    console.warn('Неуспешно четене на данните', e);
    return empty();
  }
}

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); }
  catch (e) { console.warn('Неуспешен запис', e); }
  listeners.forEach((l) => l(state));
}

export const store = {
  get: () => state,
  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },

  activeDog() { return state.dogs.find((d) => d.id === state.activeId) || state.dogs[0] || null; },
  setActive(id) { state.activeId = id; save(); },

  upsertDog(dog) {
    if (!dog.id) { dog.id = uid(); dog.createdAt = todayISO(); state.dogs.push(dog); }
    else { const i = state.dogs.findIndex((d) => d.id === dog.id); if (i >= 0) state.dogs[i] = dog; else state.dogs.push(dog); }
    if (!state.activeId) state.activeId = dog.id;
    if (dog.weight) this.addWeight(dog.id, dog.weight, todayISO(), true);
    save();
    return dog;
  },
  removeDog(id) {
    state.dogs = state.dogs.filter((d) => d.id !== id);
    state.events = state.events.filter((e) => e.dogId !== id);
    delete state.weights[id];
    state.notes = state.notes.filter((n) => n.dogId !== id);
    state.vetNotes = state.vetNotes.filter((n) => n.dogId !== id);
    if (state.activeId === id) state.activeId = state.dogs[0]?.id || null;
    save();
  },

  addWeight(dogId, kg, date = todayISO(), silent = false) {
    const list = state.weights[dogId] || (state.weights[dogId] = []);
    const same = list.find((w) => w.date === date);
    if (same) same.kg = kg; else list.push({ date, kg });
    list.sort((a, b) => a.date.localeCompare(b.date));
    if (!silent) { const d = state.dogs.find((x) => x.id === dogId); if (d && date >= (list[list.length - 1]?.date || '')) d.weight = kg; save(); }
  },
  removeWeight(dogId, date) { state.weights[dogId] = (state.weights[dogId] || []).filter((w) => w.date !== date); save(); },

  upsertEvent(ev) {
    if (!ev.id) { ev.id = uid(); state.events.push(ev); }
    else { const i = state.events.findIndex((e) => e.id === ev.id); state.events[i] = ev; }
    save();
  },
  removeEvent(id) { state.events = state.events.filter((e) => e.id !== id); save(); },

  addNote(dogId, text, kind = 'notes') { state[kind].unshift({ id: uid(), dogId, date: todayISO(), text }); save(); },
  removeNote(id, kind = 'notes') { state[kind] = state[kind].filter((n) => n.id !== id); save(); },

  toggleCheck(dogId, tipId) {
    const k = todayISO() + ':' + dogId;
    const c = state.checks[k] || (state.checks[k] = {});
    c[tipId] = !c[tipId];
    // пазим само последните 14 дни
    Object.keys(state.checks).sort().slice(0, -14).forEach((x) => delete state.checks[x]);
    save();
  },
  checksToday(dogId) { return state.checks[todayISO() + ':' + dogId] || {}; },

  pushHistory(q) {
    state.history = [q, ...state.history.filter((x) => x !== q)].slice(0, 8);
    save();
  },

  setSetting(k, v) { state.settings[k] = v; save(); },

  exportJSON() { return JSON.stringify({ app: 'kucheto-v-dzhoba', exportedAt: new Date().toISOString(), ...state }, null, 2); },
  importJSON(text) {
    const data = JSON.parse(text);
    if (!data || !Array.isArray(data.dogs)) throw new Error('Невалиден файл');
    state = { ...empty(), ...data };
    delete state.app; delete state.exportedAt;
    save();
  },
  resetAll() { state = empty(); save(); },
};
