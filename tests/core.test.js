import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { energyPlan, expectedGrowthPct, wsavaRange } from '../js/calc.js';
import { foodFor, recipeFor } from '../js/personalize.js';
import { search } from '../js/engine/search.js';
import { triage } from '../js/engine/triage.js';
import { FOODS } from '../data/foods.js';
import { SOS } from '../data/sos.js';
import { RECIPES } from '../data/recipes.js';
import { ARTICLES } from '../data/care.js';
import { SOURCES } from '../data/sources.js';

const adult = { name: 'Тест', weight: 20, activity: 'low', birthDate: '2021-01-01', sex: 'm', neutered: 'no' };

test('калории: FEDIAF 95 × kg^0,75 за ниска активност', () => {
  const p = energyPlan(adult);
  assert.ok(p.ok);
  assert.equal(Math.round(p.kcal), Math.round(95 * Math.pow(20, 0.75)));
  assert.equal(Math.round(p.treatKcal), Math.round(p.kcal * 0.1));
});

test('калории: умерена активност не надвишава горната граница на WSAVA', () => {
  const p = energyPlan({ ...adult, activity: 'moderate' });
  assert.ok(p.kcal <= wsavaRange(20)[1]);
});

test('калории: бременна/кърмеща → към ветеринар, без число', () => {
  const p = energyPlan({ ...adult, sex: 'f', neutered: 'no', repro: 'pregnant' });
  assert.equal(p.ok, false);
  assert.ok(p.refer);
});

test('кученце: формула на FEDIAF и крива на растеж', () => {
  const pct = expectedGrowthPct(30, 18);
  assert.ok(pct > 45 && pct < 56);
  const d = new Date(); d.setMonth(d.getMonth() - 4);
  const p = energyPlan({ weight: 12, expectedAdultWeight: 30, birthDate: d.toISOString().slice(0, 10) });
  assert.equal(Math.round(p.kcal), Math.round((254.1 - 135 * (12 / 30)) * Math.pow(12, 0.75)));
});

test('персонализация: алергия към пиле прави пилешкото „не“', () => {
  const chicken = FOODS.find((f) => f.id === 'chicken');
  assert.equal(foodFor(chicken, adult).verdict, 'ok');
  assert.equal(foodFor(chicken, { ...adult, allergies: ['chicken'] }).verdict, 'no');
});

test('персонализация: панкреатит скрива мазните рецепти', () => {
  const r = RECIPES.find((x) => x.id === 'pumpkin_pb_biscuits');
  assert.equal(recipeFor(r, { ...adult, conditions: ['pancreatitis'] }).status, 'hidden');
  const own = RECIPES.find((x) => x.id === 'frozen_own_food');
  assert.equal(recipeFor(own, { ...adult, conditions: ['kidney'] }).status, 'ok');
});

test('спешност: разпознава опасни ситуации', () => {
  assert.deepEqual(triage('кучето изяде шоколад').sos, ['chocolate']);
  assert.ok(triage('коремът му е подут и напъва да повърне').sos.includes('gdv'));
  assert.ok(triage('глътна чорап').sos.includes('swallowed'));
  assert.equal(triage('може ли да яде ябълка').sos.length, 0);
});

test('търсене: основни въпроси дават правилната първа тема', () => {
  const top = (q) => { const r = search(q, adult).results[0]; return r && r.type + ':' + r.item.id; };
  assert.equal(top('Може ли кучето да яде банан?'), 'food:banana');
  assert.equal(top('Изяде шоколад'), 'sos:chocolate');
  assert.equal(top('как да махна кърлеж'), 'sos:tick');
  assert.equal(top('колко пъти на ден да го храня'), 'article:feeding_basics');
  assert.equal(top('дърпа на повода'), 'article:pulling');
});

test('съдържание: всяка тема има източник, който съществува', () => {
  const check = (src, where) => { assert.ok(src && src.length, where + ' няма източник'); src.forEach((k) => assert.ok(SOURCES[k], `${where}: липсва източник ${k}`)); };
  FOODS.forEach((f) => check(f.src, 'храна ' + f.id));
  SOS.forEach((s) => check(s.src, 'SOS ' + s.id));
  ARTICLES.forEach((a) => check(a.src, 'статия ' + a.id));
  RECIPES.forEach((r) => check([r.src], 'рецепта ' + r.id));
  FOODS.filter((f) => f.sos).forEach((f) => assert.ok(SOS.find((s) => s.id === f.sos), 'липсва SOS ' + f.sos));
});

test('офлайн: всички файлове на приложението са в кеша на service worker', () => {
  const sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
  const listed = [...sw.matchAll(/'\.\/([^']+)'/g)].map((m) => m[1]);
  listed.forEach((f) => assert.ok(existsSync(new URL('../' + f, import.meta.url)), 'липсва ' + f));
  const walk = (dir) => readdirSync(new URL('../' + dir, import.meta.url), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(dir + '/' + e.name) : [dir + '/' + e.name]));
  [...walk('js'), ...walk('data')].forEach((f) => assert.ok(listed.includes(f), 'не е в sw.js: ' + f));
});
