# Глобус «Адрес на Земле» — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Интерактивная 3D-модель Земли в браузере (пошаговый урок + свободный режим + мини-игра), объясняющая школьнику 10–12 лет, как измеряются широта и долгота и как определяются координаты.

**Architecture:** Статический сайт без сборки: Three.js лежит локально в `vendor/`, ES-модули в `js/`. Состояние сцены управляется декларативными «шагами урока». Сектора-углы (широта/долгота) — полупрозрачные клинья из центра Земли с анимацией роста дуги.

**Tech Stack:** Three.js 0.170.0 (vendored), чистый ES-module JS, node --test для чистой логики, python3 http.server для раздачи.

## Global Constraints

- Three.js точно `0.170.0`: `vendor/three.module.js`, `vendor/OrbitControls.js`; в рантайме никаких CDN и npm.
- Все тексты интерфейса — русские; системный шрифт без засечек, основной текст ≥18px.
- Координаты показываются целыми градусами, округление к ближайшему целому (`Math.round`, `-0 → 0`) — везде одинаково.
- Нотация: `56° с.ш.`, `23° ю.ш.`, `38° в.д.`, `74° з.д.`, `0°`, `180°`.
- Математика сферы: `x = r·cos(lat)·sin(lon)`, `y = r·sin(lat)`, `z = r·cos(lat)·cos(lon)`; радиус глобуса R=1.
- Цвета: фон `#0b1530`; океан `#a8d4e8`; материки `#cfe3b4`; экватор `#e63946`; Гринвич `#2a9d4f`; параллели `#d9a45b`; меридианы `#7fb3d5`; сектор широты `#f4a261`; сектор долготы `#57cc99`; маркер `#ffd166`; 180-й меридиан `#ffd166`; ось `#9db2c7`.
- Сервер разработки: `python3 -m http.server 8137` из корня проекта; проверка в браузере через chrome-devtools MCP (`http://localhost:8137`).
- Каждый таск завершается коммитом в git.

---

### Task 1: Скелет проекта + vendored Three.js + минимальная сцена

**Files:**
- Create: `index.html`, `css/style.css`, `js/main.js`, `vendor/three.module.js`, `vendor/OrbitControls.js`, `.gitignore`, `README.md`

**Interfaces:**
- Produces: рабочая страница с тёмным фоном, сферой-глобусом и OrbitControls; importmap `"three" → ./vendor/three.module.js`, `"three/addons/" → ./vendor/`.

- [ ] **Step 1: Скачать Three.js 0.170.0**

```bash
mkdir -p vendor js css data tools
curl -fsSL -o vendor/three.module.js https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js
curl -fsSL -o vendor/OrbitControls.js https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/controls/OrbitControls.js
ls -la vendor/   # three.module.js ~1.2MB, OrbitControls.js ~30KB; пустых файлов быть не должно
grep -c "import" vendor/OrbitControls.js   # >0, импортирует из 'three'
```

- [ ] **Step 2: index.html**

```html
<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Адрес на Земле — как читать координаты</title>
<link rel="stylesheet" href="css/style.css">
<script type="importmap">
{ "imports": { "three": "./vendor/three.module.js", "three/addons/": "./vendor/" } }
</script>
</head>
<body>
<div id="scene"></div>
<div id="fallback" hidden>
  <h2>Не работает 3D</h2>
  <p>Ваш браузер не поддерживает WebGL. Откройте страницу в свежем Chrome, Edge, Firefox или Safari.</p>
</div>
<div id="mode-bar">
  <button id="mode-lesson" class="mode-btn active">Урок</button>
  <button id="mode-free" class="mode-btn">Свободно</button>
  <button id="mode-game" class="mode-btn">Игра</button>
  <button id="btn-help" title="Легенда">?</button>
</div>
<section id="lesson-panel" class="panel">
  <h2 id="lesson-title"></h2>
  <p id="lesson-text"></p>
  <p id="lesson-extra" class="big"></p>
  <div class="lesson-controls">
    <button id="btn-prev">← Назад</button>
    <span id="lesson-progress"></span>
    <button id="btn-next">Дальше →</button>
    <button id="btn-play" hidden>🎮 Играть</button>
  </div>
</section>
<aside id="free-panel" class="panel" hidden>
  <div id="coords-readout" class="big">—</div>
  <label>Широта <input type="range" id="lat-slider" min="-90" max="90" step="1" value="56">
    <span id="lat-val"></span></label>
  <label>Долгота <input type="range" id="lon-slider" min="-180" max="180" step="1" value="38">
    <span id="lon-val"></span></label>
  <fieldset><legend>Слои</legend>
    <label><input type="checkbox" id="lay-parallels"> параллели</label>
    <label><input type="checkbox" id="lay-meridians"> меридианы</label>
    <label><input type="checkbox" id="lay-equator" checked> экватор</label>
    <label><input type="checkbox" id="lay-greenwich" checked> Гринвич</label>
    <label><input type="checkbox" id="lay-arcs" checked> углы</label>
    <label><input type="checkbox" id="lay-cities"> города</label>
  </fieldset>
  <div id="examples">
    <button data-city="Москва">Москва</button>
    <button data-city="Гринвич">Гринвич</button>
    <button data-city="Северный полюс">Северный полюс</button>
  </div>
</aside>
<section id="game-panel" class="panel" hidden>
  <h2>Найди точку!</h2>
  <p id="game-task" class="big"></p>
  <p id="game-progress"></p>
  <p id="game-result"></p>
  <button id="game-next" hidden>Дальше →</button>
  <div id="game-final" hidden>
    <p id="game-score" class="big"></p>
    <button id="game-restart">Ещё раз</button>
  </div>
</section>
<div id="help-modal" hidden>
  <div>
    <h3>Легенда</h3>
    <ul>
      <li><span class="sw" style="background:#e63946"></span> экватор — 0° широты</li>
      <li><span class="sw" style="background:#2a9d4f"></span> Гринвичский меридиан — 0° долготы</li>
      <li><span class="sw" style="background:#f4a261"></span> угол широты: от экватора вверх/вниз</li>
      <li><span class="sw" style="background:#57cc99"></span> угол долготы: от Гринвича на восток/запад</li>
      <li><span class="sw" style="background:#ffd166"></span> маркер и линия 180°</li>
    </ul>
    <button id="help-close">Понятно</button>
  </div>
</div>
<script type="module" src="js/main.js"></script>
</body>
</html>
```

- [ ] **Step 3: css/style.css** (базовая, крупная, контрастная)

```css
* { box-sizing: border-box; margin: 0; }
html, body { height: 100%; overflow: hidden; }
body { font: 18px/1.45 system-ui, -apple-system, "Segoe UI", sans-serif; color: #eef3fb; background: #0b1530; }
#scene { position: fixed; inset: 0; }
.panel { position: fixed; background: rgba(11,21,48,.88); border: 1px solid #33507e; border-radius: 12px; padding: 14px 18px; }
#mode-bar { position: fixed; top: 12px; left: 12px; display: flex; gap: 8px; z-index: 5; }
.mode-btn.active { background: #3d6db5; color: #fff; }
button { font: inherit; background: #22395f; color: #eef3fb; border: 1px solid #4a6ea6; border-radius: 8px; padding: 6px 14px; cursor: pointer; }
button:disabled { opacity: .45; cursor: default; }
#lesson-panel { left: 12px; right: 12px; bottom: 12px; max-width: 760px; }
#lesson-panel h2 { font-size: 24px; margin-bottom: 6px; }
.lesson-controls { display: flex; align-items: center; gap: 14px; margin-top: 10px; }
.big { font-size: 24px; font-weight: 700; margin: 6px 0; }
#free-panel { top: 64px; right: 12px; width: 300px; }
#free-panel label { display: block; margin: 6px 0; }
#free-panel fieldset { border: 1px solid #33507e; margin-top: 10px; }
#game-panel { left: 50%; transform: translateX(-50%); bottom: 12px; width: 480px; text-align: center; }
.sw { display: inline-block; width: 16px; height: 16px; border-radius: 4px; vertical-align: -2px; margin-right: 6px; }
#help-modal { position: fixed; inset: 0; background: rgba(0,0,0,.6); display: flex; align-items: center; justify-content: center; z-index: 10; }
#help-modal > div { background: #13234a; padding: 20px 26px; border-radius: 12px; max-width: 420px; }
#fallback { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; text-align: center; }
@media (max-width: 760px) { #free-panel { width: 240px; } body { font-size: 16px; } }
```

- [ ] **Step 4: js/main.js (минимальная версия — каркас сцены)**

```js
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';

const container = document.getElementById('scene');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true });
} catch (e) {
  document.getElementById('fallback').hidden = false;
  throw e;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b1530);
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 0.8, 3.2);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.minDistance = 1.6;
controls.maxDistance = 8;

const globe = new THREE.Mesh(
  new THREE.SphereGeometry(1, 64, 48),
  new THREE.MeshPhongMaterial({ color: 0xa8d4e8 })
);
scene.add(globe);
scene.add(new THREE.AmbientLight(0xffffff, 1.6));
const dir = new THREE.DirectionalLight(0xffffff, 1.2);
dir.position.set(2, 1.5, 3);
scene.add(dir);

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

renderer.setAnimationLoop(() => { controls.update(); renderer.render(scene, camera); });
```

- [ ] **Step 5: .gitignore и README.md**

`.gitignore`:
```
.DS_Store
tools/node_modules/
```

`README.md`:
```markdown
# Адрес на Земле — обучающий глобус

Интерактивная 3D-модель, объясняющая, как измеряются широта, долгота
и как определяются географические координаты. Для школьников 10–12 лет.

## Запуск

Из папки проекта:

    python3 -m http.server 8137

Открыть в браузере: http://localhost:8137
(нужен любой локальный сервер — просто открыть файл двойным кликом нельзя,
браузер не даёт ES-модулям работать с file://)

Дизайн: docs/superpowers/specs/2026-08-17-globe-coordinates-design.md
```

- [ ] **Step 6: Проверить в браузере**

```bash
python3 -m http.server 8137   # в фоне из корня проекта
```
Через chrome-devtools MCP: открыть `http://localhost:8137`, снять скриншот — светло-голубая сфера на тёмном фоне, вращается мышью. `list_console_messages` — ошибок нет.

- [ ] **Step 7: Commit**

```bash
git add index.html css js vendor .gitignore README.md
git commit -m "feat: скелет проекта — сцена, UI-панели, vendored three.js"
```

---

### Task 2: coords.js — чистая математика координат (TDD)

**Files:**
- Create: `js/coords.js`, `js/coords.test.js`

**Interfaces:**
- Produces (используется всеми последующими задачами):
  - `DEG`, `RAD` — константы перевода.
  - `latLonToXYZ(lat, lon, r=1) → {x,y,z}`
  - `xyzToLatLon(x,y,z) → {lat,lon}` (lon в [-180,180])
  - `roundDeg(v) → int` (`-0 → 0`)
  - `fmtLat(lat) → "56° с.ш." | "23° ю.ш." | "0°"`
  - `fmtLon(lon) → "38° в.д." | "74° з.д." | "0°" | "180°"`
  - `fmtCoords(lat, lon) → "56° с.ш., 38° в.д."`
  - `angularDistanceDeg(lat1,lon1,lat2,lon2) → number`
  - `starsForError(d) → 3|2|1|0` (пороги ≤5/≤10/≤20)
- Модуль НЕ импортирует three — только математика, тестируется в node.

- [ ] **Step 1: Написать тесты**

`js/coords.test.js`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  latLonToXYZ, xyzToLatLon, roundDeg, fmtLat, fmtLon, fmtCoords,
  angularDistanceDeg, starsForError,
} from './coords.js';

const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);

test('latLonToXYZ базовые точки', () => {
  const p0 = latLonToXYZ(0, 0); close(p0.x, 0); close(p0.y, 0); close(p0.z, 1);
  const pN = latLonToXYZ(90, 0); close(pN.x, 0); close(pN.y, 1); close(pN.z, 0);
  const pE = latLonToXYZ(0, 90); close(pE.x, 1); close(pE.y, 0); close(pE.z, 0);
  const pW = latLonToXYZ(0, -90); close(pW.x, -1); close(pW.z, 0);
});

test('xyzToLatLon туда-обратно', () => {
  for (const [la, lo] of [[55.75, 37.6], [-33.9, 151.2], [0, -74], [12, -77]]) {
    const { x, y, z } = latLonToXYZ(la, lo);
    const back = xyzToLatLon(x, y, z);
    close(back.lat, la); close(back.lon, lo);
  }
});

test('roundDeg: округление и минус-ноль', () => {
  assert.equal(roundDeg(55.4), 55); assert.equal(roundDeg(55.5), 56);
  assert.equal(roundDeg(-0.2), 0); assert.equal(Object.is(roundDeg(-0.2), -0), false);
});

test('формат широты', () => {
  assert.equal(fmtLat(55.75), '56° с.ш.');
  assert.equal(fmtLat(-22.9), '23° ю.ш.');
  assert.equal(fmtLat(0), '0°');
  assert.equal(fmtLat(90), '90° с.ш.');
});

test('формат долготы', () => {
  assert.equal(fmtLon(37.6), '38° в.д.');
  assert.equal(fmtLon(-74), '74° з.д.');
  assert.equal(fmtLon(0), '0°');
  assert.equal(fmtLon(180), '180°'); assert.equal(fmtLon(-179.9), '180°');
});

test('fmtCoords', () => {
  assert.equal(fmtCoords(55.7558, 37.6173), '56° с.ш., 38° в.д.');
});

test('угловое расстояние', () => {
  close(angularDistanceDeg(0, 0, 0, 90), 90);
  close(angularDistanceDeg(0, 0, 90, 0), 90);
  close(angularDistanceDeg(55.75, 37.6, 55.75, 37.6), 0);
  close(angularDistanceDeg(0, 0, 0, 1), 1, 1e-6);
});

test('звёзды за ошибку', () => {
  assert.equal(starsForError(4.9), 3); assert.equal(starsForError(5), 3);
  assert.equal(starsForError(5.1), 2); assert.equal(starsForError(10), 2);
  assert.equal(starsForError(10.5), 1); assert.equal(starsForError(20), 1);
  assert.equal(starsForError(21), 0);
});
```

- [ ] **Step 2: Запустить, убедиться что падает**

Run: `node --test js/coords.test.js`
Expected: FAIL — «Cannot find module .../coords.js» (или ERR_MODULE_NOT_FOUND).

- [ ] **Step 3: Реализовать js/coords.js**

```js
export const DEG = Math.PI / 180;
export const RAD = 180 / Math.PI;

export function latLonToXYZ(lat, lon, r = 1) {
  const la = lat * DEG, lo = lon * DEG;
  return {
    x: r * Math.cos(la) * Math.sin(lo),
    y: r * Math.sin(la),
    z: r * Math.cos(la) * Math.cos(lo),
  };
}

export function xyzToLatLon(x, y, z) {
  const r = Math.hypot(x, y, z) || 1;
  const lat = Math.asin(Math.max(-1, Math.min(1, y / r))) * RAD;
  let lon = Math.atan2(x, z) * RAD;
  if (lon <= -180) lon = 180;
  return { lat, lon };
}

export function roundDeg(v) {
  const r = Math.round(v);
  return Object.is(r, -0) ? 0 : r;
}

export function fmtLat(lat) {
  const d = roundDeg(lat);
  if (d === 0) return '0°';
  return d > 0 ? `${d}° с.ш.` : `${-d}° ю.ш.`;
}

export function fmtLon(lon) {
  const d = roundDeg(lon);
  if (d === 0 || Math.abs(d) === 180) return `${Math.abs(d)}°`;
  return d > 0 ? `${d}° в.д.` : `${-d}° з.д.`;
}

export function fmtCoords(lat, lon) {
  return `${fmtLat(lat)}, ${fmtLon(lon)}`;
}

export function angularDistanceDeg(lat1, lon1, lat2, lon2) {
  const f1 = lat1 * DEG, f2 = lat2 * DEG, dl = (lon2 - lon1) * DEG;
  const c = Math.sin(f1) * Math.sin(f2) + Math.cos(f1) * Math.cos(f2) * Math.cos(dl);
  return Math.acos(Math.max(-1, Math.min(1, c))) * RAD;
}

export function starsForError(d) {
  if (d <= 5) return 3;
  if (d <= 10) return 2;
  if (d <= 20) return 1;
  return 0;
}
```

- [ ] **Step 4: Запустить тесты — PASS**

Run: `node --test js/coords.test.js`
Expected: все тесты PASS.

- [ ] **Step 5: Commit**

```bash
git add js/coords.js js/coords.test.js
git commit -m "feat: coords.js — математика координат и форматирование с тестами"
```

---

### Task 3: tween.js + labels.js — анимации и подписи

**Files:**
- Create: `js/tween.js`, `js/labels.js`
- Modify: `js/main.js` (временно: тестовая подпись + мигание для проверки)

**Interfaces:**
- tween.js: `easeInOut(t)`, `tween(ms, onUpdate(k, tRaw), ease?) → Promise`, `cancelAllTweens()`, `tweenCamera(camera, controls, {pos:[x,y,z], target:[x,y,z]}, ms=1200) → Promise` (блокирует controls на время полёта).
- labels.js: `makeLabelSprite(text, {size=26, color='#ffffff', bg='rgba(11,21,48,0.75)', scale=1}) → THREE.Sprite` и класс-функция `makeDynamicLabel(opts)` → `{ sprite, setText(text), position, visible }` (перерисовывает тот же canvas — для счётчика градусов на дуге).

- [ ] **Step 1: js/tween.js**

```js
import * as THREE from 'three';

export const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

const active = new Set();

export function tween(ms, onUpdate, ease = easeInOut) {
  return new Promise((resolve) => {
    const rec = { stop: false };
    active.add(rec);
    const t0 = performance.now();
    requestAnimationFrame(function frame(now) {
      if (rec.stop) { active.delete(rec); resolve(); return; }
      const t = Math.min(1, (now - t0) / ms);
      onUpdate(ease(t), t);
      if (t < 1) requestAnimationFrame(frame);
      else { active.delete(rec); resolve(); }
    });
  });
}

export function cancelAllTweens() {
  for (const rec of active) rec.stop = true;
  active.clear();
}

export async function tweenCamera(camera, controls, { pos, target }, ms = 1200) {
  const p0 = camera.position.clone();
  const t0 = controls.target.clone();
  const p1 = new THREE.Vector3(...pos);
  const t1 = new THREE.Vector3(...target);
  controls.enabled = false;
  await tween(ms, (k) => {
    camera.position.lerpVectors(p0, p1, k);
    controls.target.lerpVectors(t0, t1, k);
    controls.update();
  });
  controls.enabled = true;
}
```

- [ ] **Step 2: js/labels.js**

```js
import * as THREE from 'three';

function draw(canvas, text, { size, color, bg, pad }) {
  const c = canvas.getContext('2d');
  const font = `bold ${size}px system-ui, sans-serif`;
  c.font = font;
  const w = Math.ceil(c.measureText(text).width) + pad * 2;
  const h = size + pad * 2;
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  c.font = font;
  c.clearRect(0, 0, w, h);
  c.fillStyle = bg;
  c.fillRect(0, 0, w, h);
  c.fillStyle = color;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(text, w / 2, h / 2 + 1);
  return { w, h };
}

function makeSprite(canvas, { w, h, scale }) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const spr = new THREE.Sprite(new THREE.SpriteMaterial({
    map: tex, transparent: true, depthTest: false,
  }));
  spr.userData.setSize = (nw, nh) => {
    const k = 0.0035 * scale;
    spr.scale.set(nw * k, nh * k, 1);
  };
  spr.userData.setSize(w, h);
  return spr;
}

export function makeDynamicLabel(opts = {}) {
  const o = { size: 26, color: '#ffffff', bg: 'rgba(11,21,48,0.75)', scale: 1, pad: 10, ...opts };
  const canvas = document.createElement('canvas');
  const { w, h } = draw(canvas, '', o);
  const spr = makeSprite(canvas, { w, h, scale: o.scale });
  return {
    sprite: spr,
    setText(text) {
      const { w: nw, h: nh } = draw(canvas, text, o);
      spr.material.map.needsUpdate = true;
      spr.userData.setSize(nw, nh);
    },
  };
}

export function makeLabelSprite(text, opts = {}) {
  const lab = makeDynamicLabel(opts);
  lab.setText(text);
  return lab.sprite;
}
```

- [ ] **Step 3: Временная проверка в main.js**

После создания сцены добавить (удалить перед коммитом задачи 4 не требуется — удаляется в Task 9):
```js
import { makeLabelSprite } from './labels.js';
import { tween } from './tween.js';
const testLabel = makeLabelSprite('тест подписи', { color: '#ffd166' });
testLabel.position.set(0, 1.3, 0);
scene.add(testLabel);
tween(2000, (k) => { testLabel.material.opacity = 0.3 + 0.7 * Math.abs(Math.sin(k * Math.PI * 3)); });
```

- [ ] **Step 4: Проверить в браузере**

Скриншот: подпись «тест подписи» над сферой, мигает и гаснет. Консоль без ошибок.

- [ ] **Step 5: Commit**

```bash
git add js/tween.js js/labels.js js/main.js
git commit -m "feat: tween-хелпер и canvas-подписи-спрайты"
```

---

### Task 4: globe.js — глобус с континентами, осью, полюсами + данные

**Files:**
- Create: `js/globe.js`, `tools/prepare-continents.mjs`, `data/continents.json`
- Modify: `js/main.js` (подключить createGlobe вместо заглушки-сферы)

**Interfaces:**
- Consumes: `latLonToXYZ` (Task 2), `makeLabelSprite` (Task 3).
- Produces: `createGlobe(scene) → Promise<globe>` где
  `globe = { group, sphereMesh, setContinents(), axisGroup, poleLabels, shells: {north, south, setGlow(op)} }`.
  `sphereMesh` — для рейкастов (перетаскивание маркера, клики игры).
  `shells` — полупрозрачные полусферы для «моргания» полушарий на шаге 2 (методы `north.setGlow(v)`, `south.setGlow(v)`, v∈[0,1] → opacity 0..0.22).

- [ ] **Step 1: Скачать контуры материков (одноразовый dev-скрипт)**

`tools/prepare-continents.mjs`:
```js
// Готовит data/continents.json — кольца [lon,lat] всей суши, координаты до 2 знаков.
import { writeFile } from 'node:fs/promises';

const URLS = [
  'https://raw.githubusercontent.com/martynafford/natural-earth-geojson/master/110m/physical/ne_110m_land.json',
  'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_land.geojson',
];

async function main() {
  let geo = null;
  for (const u of URLS) {
    try {
      const r = await fetch(u);
      if (!r.ok) throw new Error(r.status);
      const j = await r.json();
      if (j.type === 'Topology') throw new Error('topojson не поддерживается этим скриптом');
      geo = j; break;
    } catch (e) { console.error('не получилось:', u, e.message); }
  }
  if (!geo) {
    console.error('Оба URL не сработали. Запасной путь: npm i world-atlas topojson-client в tools/ и конвертация feature(land-110m).');
    process.exit(1);
  }
  const rings = [];
  const pushRing = (ring) => {
    rings.push(ring.map(([lon, lat]) => [
      Math.round(lon * 100) / 100, Math.round(lat * 100) / 100,
    ]));
  };
  const features = geo.type === 'FeatureCollection' ? geo.features : [geo];
  for (const f of features) {
    const g = f.type === 'Feature' ? f.geometry : f;
    if (!g) continue;
    if (g.type === 'Polygon') g.coordinates.forEach(pushRing);
    else if (g.type === 'MultiPolygon') g.coordinates.forEach((poly) => poly.forEach(pushRing));
  }
  await writeFile('data/continents.json', JSON.stringify({ rings }));
  console.log('ок:', rings.length, 'колец');
}
main();
```

Run: `node tools/prepare-continents.mjs` → `data/continents.json` создан, в логе «ок: N колец» (N ≈ 130–150).
Если оба URL недоступны — запасной путь: `cd tools && npm init -y && npm i world-atlas@2 topojson-client@3`, скрипт-обёртка `feature(topo, objects.land)` → тот же вывод; `tools/node_modules` в .gitignore уже есть.

- [ ] **Step 2: js/globe.js**

```js
import * as THREE from 'three';
import { latLonToXYZ } from './coords.js';
import { makeLabelSprite } from './labels.js';

const W = 2048, H = 1024;

function drawContinents(rings) {
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const c = canvas.getContext('2d');
  c.fillStyle = '#a8d4e8';
  c.fillRect(0, 0, W, H);
  c.fillStyle = '#cfe3b4';
  for (const ring of rings) {
    c.beginPath();
    let px = null;
    for (const [lon, lat] of ring) {
      const x = ((lon + 180) / 360) * W;
      const y = ((90 - lat) / 180) * H;
      // скачок через 180-й меридиан — не тянуть линию через всю карту
      if (px === null || Math.abs(x - px) > W / 2) c.moveTo(x, y);
      else c.lineTo(x, y);
      px = x;
    }
    c.closePath();
    c.fill();
  }
  return canvas;
}

export async function createGlobe(scene) {
  const group = new THREE.Group();
  scene.add(group);

  let mat;
  try {
    const res = await fetch('data/continents.json');
    const { rings } = await res.json();
    const tex = new THREE.CanvasTexture(drawContinents(rings));
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    mat = new THREE.MeshPhongMaterial({ map: tex });
  } catch (e) {
    console.warn('continents.json не загрузился, глобус однотонный', e);
    mat = new THREE.MeshPhongMaterial({ color: 0xa8d4e8 });
  }
  const sphereMesh = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), mat);
  // калибровка: левый край текстуры (lon=-180) смотрит на (0,0,-1)
  sphereMesh.rotation.y = -Math.PI / 2;
  group.add(sphereMesh);

  // ось и полюса
  const axisGroup = new THREE.Group();
  const axis = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.008, 2.5, 12),
    new THREE.MeshBasicMaterial({ color: 0x9db2c7 })
  );
  axisGroup.add(axis);
  const poleMat = new THREE.MeshBasicMaterial({ color: 0xf2f2f2 });
  for (const s of [1, -1]) {
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.025, 16, 12), poleMat);
    dot.position.set(0, 1.02 * s, 0);
    axisGroup.add(dot);
  }
  const nLabel = makeLabelSprite('Северный полюс', { scale: 0.9 });
  nLabel.position.set(0, 1.24, 0);
  const sLabel = makeLabelSprite('Южный полюс', { scale: 0.9 });
  sLabel.position.set(0, -1.24, 0);
  axisGroup.add(nLabel, sLabel);
  group.add(axisGroup);

  // полусферы для «моргания» полушарий (шаг 2 урока)
  const mkShell = (thetaStart) => {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(1.003, 48, 24, 0, Math.PI * 2, thetaStart, Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false })
    );
    group.add(m);
    return { mesh: m, setGlow: (v) => { m.material.opacity = 0.22 * v; } };
  };
  const shells = { north: mkShell(0), south: mkShell(Math.PI / 2) };

  return { group, sphereMesh, axisGroup, shells };
}
```

- [ ] **Step 3: Подключить в main.js**

Заменить заглушку-сферу на:
```js
import { createGlobe } from './globe.js';
// ... после создания scene:
const globe = await createGlobe(scene);
```
`main.js` обёрнут в асинхронный IIFE или top-level await (ES-модули позволяют).

- [ ] **Step 4: Проверить в браузере**

Скриншот: узнаваемые материки, светло-голубой океан, Лондон/Англия — на линии, куда потом встанет зелёный Гринвич (визуально: Британия примерно по центру при камере (0,0.8,3.2)). Ось и подписи полюсов видны. Консоль без ошибок (warn про continents.json — только если файл не нашлась).

- [ ] **Step 5: Commit**

```bash
git add js/globe.js tools/prepare-continents.mjs data/continents.json js/main.js
git commit -m "feat: глобус с континентами из natural earth, ось, полюса, полусферы"
```

---

### Task 5: graticule.js — сетка, экватор, Гринвич, 180-й

**Files:**
- Create: `js/graticule.js`
- Modify: `js/main.js` (подключить)

**Interfaces:**
- Consumes: `latLonToXYZ` (Task 2), `makeLabelSprite` (Task 3).
- Produces: `createGraticule(scene) → grat`:
  - `grat.group` — вся сетка (добавлена в scene, всё скрыто, кроме ничего);
  - `grat.setLayers({ parallels, meridians, equator, greenwich })` — видимость слоёв (bool);
  - `grat.setMeridian180(v: bool)` и `grat.pulseMeridian180(ms)` — линия 180° для шага 7;
  - `grat.setPointHighlight(lat, lon | null)` — яркие параллель и меридиан точки (для шага 8): оранжевая параллель `#f4a261`, зелёный меридиан `#57cc99`, радиус трубок 0.005, на высоте 1.004.

- [ ] **Step 1: js/graticule.js**

```js
import * as THREE from 'three';
import { latLonToXYZ, DEG } from './coords.js';
import { makeLabelSprite } from './labels.js';

function circle(lat, r, n = 160) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const lon = (i / n) * 360 - 180;
    const p = latLonToXYZ(lat, lon, r);
    pts.push(new THREE.Vector3(p.x, p.y, p.z));
  }
  return pts;
}

function meridianSeg(lon, r, n = 120) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const lat = -90 + (i / n) * 180;
    const p = latLonToXYZ(lat, lon, r);
    pts.push(new THREE.Vector3(p.x, p.y, p.z));
  }
  return pts;
}

function tubeFrom(points, closed, radius, color) {
  const curve = new THREE.CatmullRomCurve3(points, closed);
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 220, radius, 8, closed),
    new THREE.MeshBasicMaterial({ color })
  );
  return mesh;
}

function thinLine(points, color, opacity = 0.8) {
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity })
  );
}

export function createGraticule(scene) {
  const group = new THREE.Group();
  scene.add(group);

  const parallels = new THREE.Group();
  for (let lat = -80; lat <= 80; lat += 10) {
    if (lat === 0) continue;
    const line = thinLine(circle(lat, 1.002), 0xd9a45b);
    parallels.add(line);
    if (lat % 10 === 0) {
      const lab = makeLabelSprite(`${Math.abs(lat)}°`, { size: 20, color: '#d9a45b', bg: 'rgba(11,21,48,0.55)', scale: 0.7 });
      const p = latLonToXYZ(lat, 0, 1.06);
      lab.position.set(p.x, p.y, p.z);
      parallels.add(lab);
    }
  }

  const meridians = new THREE.Group();
  for (let lon = -180 + 15; lon <= 180 - 15; lon += 15) {
    if (lon === 0) continue;
    meridians.add(thinLine(meridianSeg(lon, 1.002), 0x7fb3d5, 0.7));
  }

  const equator = tubeFrom(circle(0, 1.004), true, 0.006, 0xe63946);
  const equatorLabel = makeLabelSprite('ЭКВАТОР — 0° широты', { color: '#ffb3ba' });
  {
    const p = latLonToXYZ(0, 60, 1.12);
    equatorLabel.position.set(p.x, p.y, p.z);
  }

  const greenwich = tubeFrom(meridianSeg(0, 1.004).concat(meridianSeg(180, 1.004).reverse()), false, 0.006, 0x2a9d4f);
  const greenwichLabel = makeLabelSprite('Гринвичский меридиан — 0° долготы', { color: '#9fe6b0' });
  {
    const p = latLonToXYZ(35, 0, 1.16);
    greenwichLabel.position.set(p.x, p.y, p.z);
  }

  const meridian180 = tubeFrom(meridianSeg(180, 1.004), false, 0.005, 0xffd166);
  const m180Label = makeLabelSprite('180°', { size: 20, color: '#ffd166', scale: 0.8 });
  {
    const p = latLonToXYZ(0, 180, 1.1);
    m180Label.position.set(p.x, p.y, p.z);
  }

  group.add(parallels, meridians, equator, equatorLabel, greenwich, greenwichLabel, meridian180, m180Label);

  // подсветка параллели+меридиана точки (шаг 8)
  const hiPar = tubeFrom(circle(0, 1.004), true, 0.005, 0xf4a261);
  const hiMer = tubeFrom(meridianSeg(0, 1.004), false, 0.005, 0x57cc99);
  hiPar.visible = hiMer.visible = false;
  group.add(hiPar, hiMer);

  parallels.visible = meridians.visible = equator.visible = false;
  equatorLabel.visible = greenwich.visible = greenwichLabel.visible = false;
  meridian180.visible = m180Label.visible = false;

  function rebuild(obj, points, closed) {
    obj.geometry.dispose();
    const curve = new THREE.CatmullRomCurve3(points, closed);
    obj.geometry = new THREE.TubeGeometry(curve, 220, 0.005, 8, closed);
  }

  return {
    group,
    setLayers({ parallels: p, meridians: m, equator: e, greenwich: g }) {
      parallels.visible = !!p;
      meridians.visible = !!m;
      equator.visible = equatorLabel.visible = !!e;
      greenwich.visible = greenwichLabel.visible = !!g;
    },
    setMeridian180(v) { meridian180.visible = m180Label.visible = !!v; },
    async pulseMeridian180(tween) {
      this.setMeridian180(true);
      const mat = meridian180.material;
      mat.transparent = true;
      await tween(2400, (k) => { mat.opacity = 0.35 + 0.65 * Math.abs(Math.sin(k * Math.PI * 3)); });
      mat.opacity = 1;
    },
    setPointHighlight(lat, lon) {
      if (lat === null) { hiPar.visible = hiMer.visible = false; return; }
      rebuild(hiPar, circle(lat, 1.004), true);
      rebuild(hiMer, meridianSeg(lon, 1.004), false);
      hiPar.visible = hiMer.visible = true;
    },
  };
}
```

- [ ] **Step 2: Подключить в main.js**

```js
import { createGraticule } from './graticule.js';
const grat = createGraticule(scene);
grat.setLayers({ parallels: true, meridians: true, equator: true, greenwich: true }); // временно, для проверки
```

- [ ] **Step 3: Проверить в браузере**

Скриншот: красный экватор, зелёный Гринвич (проходит через Лондон!), тонкие оранжевые параллели с подписями 10°…80°, синеватые меридианы. Консоль чистая.

- [ ] **Step 4: Commit**

```bash
git add js/graticule.js js/main.js
git commit -m "feat: сетка параллелей и меридианов, экватор, Гринвич, 180-й, подсветка точки"
```

---

### Task 6: angles.js — сектора-углы широты и долготы

**Files:**
- Create: `js/angles.js`
- Modify: `js/main.js` (временно показать углы Москвы для проверки)

**Interfaces:**
- Consumes: `latLonToXYZ`, `fmtLat`, `fmtLon`, `roundDeg` (Task 2); `tween`, `cancelAllTweens` (Task 3); `makeDynamicLabel` (Task 3).
- Produces: `createArcs(scene) → { lat, lon }`, каждый —
  - `show()`, `hide()`,
  - `set(latOrLon, lon?)` — мгновенно показать сектор до значения (для шага 8 и свободного режима); для `lat`: `lat.set(lat, lon)`, для `lon`: `lon.set(lon)`;
  - `grow(latOrLon, lon?, ms=1600) → Promise` — анимация от 0° до значения, подпись считает целыми градусами и в конце показывает формат `fmtLat/fmtLon`;
  - сектор широты — оранжевый `#f4a261`, в плоскости меридиана `lon`, от направления на экватор вверх/вниз; сектор долготы — зелёный `#57cc99`, в плоскости экватора, от Гринвича на восток (положит.) / запад (отрицат.).
  - Радиус сектора 1.05, линия дуги — труба радиуса 0.004 на радиусе 1.08, подпись — на середине дуги, радиус 1.2.

- [ ] **Step 1: js/angles.js**

```js
import * as THREE from 'three';
import { latLonToXYZ, fmtLat, fmtLon, roundDeg, DEG } from './coords.js';
import { tween } from './tween.js';
import { makeDynamicLabel } from './labels.js';

function basisQuat(xDir, yDir) {
  const z = new THREE.Vector3().crossVectors(xDir, yDir);
  const m = new THREE.Matrix4().makeBasis(
    xDir.clone().normalize(), yDir.clone().normalize(), z.normalize()
  );
  return new THREE.Quaternion().setFromRotationMatrix(m);
}

function wedgeGeometry(angle, r = 1.05) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.absarc(0, 0, r, 0, angle, angle < 0);
  shape.lineTo(0, 0);
  return new THREE.ShapeGeometry(shape, 48);
}

function arcTubeGeometry(angle, r = 1.08) {
  const pts = [];
  const n = 64;
  for (let i = 0; i <= n; i++) {
    const a = angle * (i / n);
    pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0));
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 96, 0.004, 6, false);
}

function makeArc(color) {
  const group = new THREE.Group();
  const fill = new THREE.Mesh(
    wedgeGeometry(0.0001),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false })
  );
  const arcLine = new THREE.Mesh(
    arcTubeGeometry(0.0001),
    new THREE.MeshBasicMaterial({ color })
  );
  const label = makeDynamicLabel({ color: '#ffffff', scale: 1.15 });
  group.add(fill, arcLine, label.sprite);
  group.visible = false;
  return { group, fill, arcLine, label };
}

function redraw(arc, angle, labelText) {
  arc.fill.geometry.dispose();
  arc.fill.geometry = wedgeGeometry(angle);
  arc.arcLine.geometry.dispose();
  arc.arcLine.geometry = arcTubeGeometry(angle);
  const mid = angle / 2;
  arc.label.sprite.position.set(Math.cos(mid) * 1.2, Math.sin(mid) * 1.2, 0);
  arc.label.setText(labelText);
}

export function createArcs(scene) {
  const latArc = makeArc(0xf4a261);
  const lonArc = makeArc(0x57cc99);
  scene.add(latArc.group, lonArc.group);

  const lat = {
    show() { latArc.group.visible = true; },
    hide() { latArc.group.visible = false; },
    orient(lon) {
      // X — направление на экватор в меридиане lon, Y — вверх
      const e = latLonToXYZ(0, lon);
      latArc.group.quaternion.copy(basisQuat(
        new THREE.Vector3(e.x, 0, e.z),
        new THREE.Vector3(0, 1, 0)
      ));
    },
    set(latDeg, lon) {
      this.orient(lon);
      redraw(latArc, latDeg * DEG, fmtLat(latDeg));
      this.show();
    },
    async grow(latDeg, lon, ms = 1600) {
      this.orient(lon);
      this.show();
      await tween(ms, (k) => {
        const v = latDeg * k;
        redraw(latArc, v * DEG, fmtLat(v));
      });
      redraw(latArc, latDeg * DEG, fmtLat(latDeg));
    },
  };

  const lon = {
    show() { lonArc.group.visible = true; },
    hide() { lonArc.group.visible = false; },
    orient() {
      // X — направление на Гринвич (0,0,1), Y — на восток (1,0,0)
      lonArc.group.quaternion.copy(basisQuat(
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(1, 0, 0)
      ));
    },
    set(lonDeg) {
      this.orient();
      redraw(lonArc, lonDeg * DEG, fmtLon(lonDeg));
      this.show();
    },
    async grow(lonDeg, ms = 1600) {
      this.orient();
      this.show();
      await tween(ms, (k) => {
        const v = lonDeg * k;
        redraw(lonArc, v * DEG, fmtLon(v));
      });
      redraw(lonArc, lonDeg * DEG, fmtLon(lonDeg));
    },
  };

  return { lat, lon };
}
```

Примечание: во время `grow` подпись показывает целые градусы (например «29° с.ш.» → … → «56° с.ш.»), т.к. `fmtLat` округляет.

- [ ] **Step 2: Временная проверка в main.js**

```js
import { createArcs } from './angles.js';
const arcs = createArcs(scene);
arcs.lat.grow(55.7558, 37.6173, 2000).then(() => arcs.lon.grow(37.6173, 2000));
```

- [ ] **Step 3: Проверить в браузере**

Скриншоты (2 шт, с интервалом): оранжевый сектор растёт от экватора вверх до Москвы с подписью «56° с.ш.»; затем зелёный — от Гринвича на восток с подписью «38° в.д.». Сектора — ровные клинья из центра. Консоль чистая.

- [ ] **Step 4: Commit**

```bash
git add js/angles.js js/main.js
git commit -m "feat: сектора-углы широты и долготы с анимацией роста и счётчиком градусов"
```

---

### Task 7: cities.js + marker.js — маркер и города

**Files:**
- Create: `js/cities.js`, `js/marker.js`
- Modify: `js/main.js` (подключить; рейкаст-хелпер)

**Interfaces:**
- cities.js: `CITIES` — массив `{name, lat, lon}` (точные дробные); `EXAMPLES` — объект для кнопок-примеров.
- marker.js: `createMarker(scene) → marker`:
  - `marker.setLatLon(lat, lon)`, `marker.show()`, `marker.hide()`;
  - `marker.group` — для добавления в сцену (внутри createMarker);
  - `marker.pinAt(lat, lon)` (в main): рейкаст попадания — в main.js общий хелпер `raycastSphere(event) → {lat,lon}|null` и `raycastMarker(event) → bool`;
  - перетаскивание: в main.js (Task 8) — pointerdown на маркер → controls выключаются до pointerup.
- main.js Produces (используют lesson/freeplay/game в Tasks 8–10):
  - `app.raycastSphere(event) → {lat, lon} | null`
  - `app.raycastMarker(event) → boolean`
  - `app.citiesLayer` — группа булавок городов; `app.cityHoverLabel` — динамическая подпись.

- [ ] **Step 1: js/cities.js**

```js
export const CITIES = [
  { name: 'Москва', lat: 55.7558, lon: 37.6173 },
  { name: 'Санкт-Петербург', lat: 59.9311, lon: 30.3609 },
  { name: 'Лондон', lat: 51.5074, lon: -0.1278 },
  { name: 'Каир', lat: 30.0444, lon: 31.2357 },
  { name: 'Нью-Йорк', lat: 40.7128, lon: -74.0060 },
  { name: 'Рио-де-Жанейро', lat: -22.9068, lon: -43.1729 },
  { name: 'Сидней', lat: -33.8688, lon: 151.2093 },
  { name: 'Токио', lat: 35.6762, lon: 139.6503 },
  { name: 'Пекин', lat: 39.9042, lon: 116.4074 },
  { name: 'Дели', lat: 28.6139, lon: 77.2090 },
  { name: 'Кейптаун', lat: -33.9249, lon: 18.4241 },
  { name: 'Лима', lat: -12.0464, lon: -77.0428 },
  { name: 'Гонолулу', lat: 21.3069, lon: -157.8583 },
];

export const EXAMPLES = {
  'Москва': CITIES[0],
  'Гринвич': { lat: 51.4779, lon: 0 },
  'Северный полюс': { lat: 90, lon: 0 },
};
```

- [ ] **Step 2: js/marker.js**

```js
import * as THREE from 'three';
import { latLonToXYZ } from './coords.js';

export function createMarker(scene) {
  const group = new THREE.Group();
  // булавка вдоль +Z: головка + ножка
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.038, 20, 16),
    new THREE.MeshBasicMaterial({ color: 0xffd166 })
  );
  head.position.set(0, 0, 0.075);
  const stick = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.008, 0.075, 8),
    new THREE.MeshBasicMaterial({ color: 0xffd166 })
  );
  stick.rotation.x = Math.PI / 2;
  stick.position.set(0, 0, 0.0375);
  // невидимая сфера-мишень для удобного захвата
  const hit = new THREE.Mesh(
    new THREE.SphereGeometry(0.11, 8, 6),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hit.name = 'marker-hit';
  group.add(head, stick, hit);
  group.visible = false;
  scene.add(group);

  return {
    group, hit,
    setLatLon(lat, lon) {
      const p = latLonToXYZ(lat, lon, 1);
      group.position.set(0, 0, 0);
      group.position.set(p.x, p.y, p.z);
      group.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(p.x, p.y, p.z).normalize()
      );
    },
    show() { group.visible = true; },
    hide() { group.visible = false; },
  };
}
```

- [ ] **Step 3: Рейкаст-хелперы и слой городов в main.js**

```js
import { CITIES } from './cities.js';
import { createMarker } from './marker.js';
import { makeDynamicLabel } from './labels.js';

const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();

function toNDC(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  ndc.set(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1
  );
}

function raycastSphere(event) {
  toNDC(event);
  raycaster.setFromCamera(ndc, camera);
  const hits = raycaster.intersectObject(globe.sphereMesh);
  if (!hits.length) return null;
  const p = hits[0].point;
  return xyzToLatLon(p.x, p.y, p.z);
}

function raycastMarker(event) {
  toNDC(event);
  raycaster.setFromCamera(ndc, camera);
  return raycaster.intersectObject(marker.hit).length > 0;
}

const marker = createMarker(scene);

// слой городов
const citiesLayer = new THREE.Group();
const cityMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
for (const c of CITIES) {
  const pin = new THREE.Mesh(new THREE.SphereGeometry(0.014, 10, 8), cityMat);
  const p = latLonToXYZ(c.lat, c.lon, 1.01);
  pin.position.set(p.x, p.y, p.z);
  pin.userData.city = c;
  citiesLayer.add(pin);
}
citiesLayer.visible = false;
scene.add(citiesLayer);

const cityHoverLabel = makeDynamicLabel({ color: '#ffd166' });
cityHoverLabel.sprite.visible = false;
scene.add(cityHoverLabel.sprite);
```
Импортировать `xyzToLatLon`, `latLonToXYZ` из coords.js. Временно для проверки: `marker.setLatLon(55.7558, 37.6173); marker.show();` — жёлтая булавка на Москве.

- [ ] **Step 4: Проверить в браузере**

Скриншот: булавка на Москве (севернее экватора, восточнее Гринвича). Консоль чистая.

- [ ] **Step 5: Commit**

```bash
git add js/cities.js js/marker.js js/main.js
git commit -m "feat: маркер-булавка, слой городов, рейкаст-хелперы"
```

---

### Task 8: Каркас UI + состояние + свободный режим (freeplay.js)

**Files:**
- Create: `js/freeplay.js`
- Modify: `js/main.js` (сборка приложения: state, переключение режимов, перетаскивание маркера, hover городов; удалить временные demo-вставки задач 3–7)

**Interfaces:**
- Consumes: всё из Tasks 2–7; DOM-элементы из Task 1.
- Produces (в `app`, передаваемый в lesson/game):
  - `app = { THREE, scene, camera, renderer, controls, globe, grat, arcs, marker, citiesLayer, cityHoverLabel, raycastSphere, raycastMarker, state, setMode(mode), gotoStep(n), sleepTracked(ms), tweenCamera(opts), ui }`
  - `app.state = { mode: 'lesson', step: 0, lat: 55.7558, lon: 37.6173 }`
  - `app.sleepTracked(ms) → Promise` — setTimeout с отменой (реестр очищается при gotoStep/setMode);
  - `freeplay.enter()`, `freeplay.leave()`, `freeplay.update(lat, lon, opts)` — центральная функция синхронизации: маркер + сектора + подпись координат + слайдеры + `state`.

- [ ] **Step 1: js/freeplay.js**

```js
import { fmtLat, fmtLon } from './coords.js';
import { EXAMPLES } from './cities.js';

export function createFreeplay(app) {
  const {
    ui: {
      latSlider, lonSlider, latVal, lonVal, coordsReadout,
      layParallels, layMeridians, layEquator, layGreenwich, layArcs, layCities,
    }, grat, arcs, marker, citiesLayer, state,
  } = app;

  function update(lat, lon, fromSlider = false) {
    state.lat = lat; state.lon = lon;
    marker.setLatLon(lat, lon);
    if (layArcs.checked) { arcs.lat.set(lat, lon); arcs.lon.set(lon); }
    else { arcs.lat.hide(); arcs.lon.hide(); }
    coordsReadout.textContent = `${fmtLat(lat)}, ${fmtLon(lon)}`;
    latVal.textContent = fmtLat(lat);
    lonVal.textContent = fmtLon(lon);
    if (!fromSlider) {
      latSlider.value = Math.round(lat);
      lonSlider.value = Math.round(lon);
    }
  }

  latSlider.addEventListener('input', () => update(+latSlider.value, state.lon, true));
  lonSlider.addEventListener('input', () => update(state.lat, +lonSlider.value, true));

  const layerMap = [
    [layParallels, (v) => grat.setLayers({ parallels: v })],
    [layMeridians, (v) => grat.setLayers({ meridians: v })],
  ];
  // setLayers перекезаписывает всё — собирать состояние целиком:
  function applyLayers() {
    grat.setLayers({
      parallels: layParallels.checked, meridians: layMeridians.checked,
      equator: layEquator.checked, greenwich: layGreenwich.checked,
    });
    grat.setMeridian180(false);
    grat.setPointHighlight(null);
    citiesLayer.visible = layCities.checked;
    if (layArcs.checked) { arcs.lat.set(state.lat, state.lon); arcs.lon.set(state.lon); }
    else { arcs.lat.hide(); arcs.lon.hide(); }
  }
  for (const [box] of layerMap) box.addEventListener('change', applyLayers);
  layEquator.addEventListener('change', applyLayers);
  layGreenwich.addEventListener('change', applyLayers);
  layArcs.addEventListener('change', applyLayers);
  layCities.addEventListener('change', applyLayers);

  for (const btn of document.querySelectorAll('#examples button')) {
    btn.addEventListener('click', async () => {
      const ex = EXAMPLES[btn.dataset.city];
      await app.flyMarker(ex.lat, ex.lon);
    });
  }

  return {
    enter() {
      marker.show();
      applyLayers();
      update(state.lat, state.lon);
    },
    leave() {},
    update,
  };
}
```
`app.flyMarker(lat, lon)` — плавный переезд маркера (в main.js, Task 8 Step 2): твин 800мс интерполяцией по кратчайшей дуге (slerp направлений) с вызовом `freeplay.update` на каждом кадре.

- [ ] **Step 2: main.js — сборка приложения**

Удалить временные вставки (тестовая подпись, демо-сетки, демо-дуг, демо-маркера). Собрать:

```js
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';
import { latLonToXYZ, xyzToLatLon, fmtLat, fmtLon } from './coords.js';
import { createGlobe } from './globe.js';
import { createGraticule } from './graticule.js';
import { createArcs } from './angles.js';
import { createMarker } from './marker.js';
import { CITIES, EXAMPLES } from './cities.js';
import { makeDynamicLabel } from './labels.js';
import { tween, cancelAllTweens, tweenCamera } from './tween.js';
import { createFreeplay } from './freeplay.js';

// ... сцена/рендер/свет как раньше ...

const ui = {
  lessonPanel: document.getElementById('lesson-panel'),
  lessonTitle: document.getElementById('lesson-title'),
  lessonText: document.getElementById('lesson-text'),
  lessonExtra: document.getElementById('lesson-extra'),
  lessonProgress: document.getElementById('lesson-progress'),
  btnPrev: document.getElementById('btn-prev'),
  btnNext: document.getElementById('btn-next'),
  btnPlay: document.getElementById('btn-play'),
  freePanel: document.getElementById('free-panel'),
  coordsReadout: document.getElementById('coords-readout'),
  latSlider: document.getElementById('lat-slider'),
  lonSlider: document.getElementById('lon-slider'),
  latVal: document.getElementById('lat-val'),
  lonVal: document.getElementById('lon-val'),
  layParallels: document.getElementById('lay-parallels'),
  layMeridians: document.getElementById('lay-meridians'),
  layEquator: document.getElementById('lay-equator'),
  layGreenwich: document.getElementById('lay-greenwich'),
  layArcs: document.getElementById('lay-arcs'),
  layCities: document.getElementById('lay-cities'),
  gamePanel: document.getElementById('game-panel'),
  gameTask: document.getElementById('game-task'),
  gameProgress: document.getElementById('game-progress'),
  gameResult: document.getElementById('game-result'),
  gameNext: document.getElementById('game-next'),
  gameFinal: document.getElementById('game-final'),
  gameScore: document.getElementById('game-score'),
  gameRestart: document.getElementById('game-restart'),
};

const state = { mode: 'lesson', step: 0, lat: 55.7558, lon: 37.6173 };

const timers = new Set();
function sleepTracked(ms) {
  return new Promise((res) => {
    const id = setTimeout(() => { timers.delete(id); res(); }, ms);
    timers.add(id);
  });
}
function clearTracked() { for (const id of timers) clearTimeout(id); timers.clear(); }

const app = {
  THREE, scene, camera, renderer, controls, globe, grat, arcs, marker,
  citiesLayer, cityHoverLabel, raycastSphere, raycastMarker, state, ui,
  sleepTracked,
  tweenCamera: (opts, ms) => tweenCamera(camera, controls, opts, ms),
  setMode, gotoStep: (n) => lesson && lesson.goto(n),
  async flyMarker(lat, lon) {
    const p0 = latLonToXYZ(state.lat, state.lon);
    const q0 = new THREE.Vector3(p0.x, p0.y, p0.z).normalize();
    const q1 = new THREE.Vector3(...Object.values(latLonToXYZ(lat, lon, 1))).normalize();
    cancelAllTweens();
    await tween(800, (k) => {
      const q = q0.clone().slerp(q1, k);
      const ll = xyzToLatLon(q.x, q.y, q.z);
      freeplay.update(ll.lat, ll.lon);
    });
  },
};

const freeplay = createFreeplay(app);

// перетаскивание маркера (только в 'free')
let dragging = false;
renderer.domElement.addEventListener('pointerdown', (e) => {
  if (state.mode !== 'free' || !raycastMarker(e)) return;
  dragging = true;
  controls.enabled = false;
  renderer.domElement.style.cursor = 'grabbing';
});
renderer.domElement.addEventListener('pointermove', (e) => {
  if (state.mode === 'free' && dragging) {
    const ll = raycastSphere(e);
    if (ll) freeplay.update(ll.lat, ll.lon);
  } else if (state.mode === 'free' && citiesLayer.visible) {
    hoverCity(e);
  } else if (state.mode === 'free') {
    renderer.domElement.style.cursor = raycastMarker(e) ? 'grab' : 'default';
  }
});
addEventListener('pointerup', () => {
  if (dragging) { dragging = false; controls.enabled = true; renderer.domElement.style.cursor = 'default'; }
});

function hoverCity(e) {
  toNDC(e);
  raycaster.setFromCamera(ndc, camera);
  const hits = raycaster.intersectObject(citiesLayer, true);
  if (hits.length) {
    const c = hits[0].object.userData.city;
    cityHoverLabel.setText(c.name);
    cityHoverLabel.sprite.visible = true;
    const p = latLonToXYZ(c.lat, c.lon, 1.09);
    cityHoverLabel.sprite.position.set(p.x, p.y, p.z);
  } else {
    cityHoverLabel.sprite.visible = false;
  }
}

// переключение режимов
const lesson = null; // создаётся в Task 9
const game = null;   // создаётся в Task 10
function setMode(mode) {
  cancelAllTweens();
  clearTracked();
  state.mode = mode;
  for (const [id, m] of [['lesson', lesson], ['free', freeplay], ['game', game]]) {
    const btn = document.getElementById('mode-' + id);
    btn.classList.toggle('active', mode === id);
  }
  ui.lessonPanel.hidden = mode !== 'lesson';
  ui.freePanel.hidden = mode !== 'free';
  ui.gamePanel.hidden = mode !== 'game';
  ui.lessonExtra.textContent = '';
  controls.autoRotate = false;
  cityHoverLabel.sprite.visible = false;
  if (mode === 'free') freeplay.enter();
  if (lesson && mode === 'lesson') lesson.goto(state.step);
  if (game && mode === 'game') game.enter();
}
document.getElementById('mode-lesson').onclick = () => setMode('lesson');
document.getElementById('mode-free').onclick = () => setMode('free');
document.getElementById('mode-game').onclick = () => setMode('game');

// справка
const helpModal = document.getElementById('help-modal');
document.getElementById('btn-help').onclick = () => (helpModal.hidden = false);
document.getElementById('help-close').onclick = () => (helpModal.hidden = true);

window.__app = app; // хук для QA-проверок
```

- [ ] **Step 3: Проверить в браузере (скриптом через evaluate_script)**

1. `window.__app.setMode('free')` — панель справа видна, булавка на Москве, в readout «56° с.ш., 38° в.д.» (скриншот).
2. `window.__app.flyMarker(-22.9, -43.17)` — булавка уезжает в Рио, readout «23° ю.ш., 43° з.д.».
3. Слайдер: установить `latSlider.value=0; dispatchEvent(new Event('input'))` → readout «0°, 43° з.д.», маркер на экваторе.
4. `window.__app.setMode('lesson')` — панели поменялись, ошибок нет (lesson ещё нет — gotoStep защищён: `lesson &&`).
Консоль чистая. Слайдеры и readout синхронны.

- [ ] **Step 4: Commit**

```bash
git add js/freeplay.js js/main.js
git commit -m "feat: сборка приложения, режимы, свободный режим со слайдерами и слоями"
```

---

### Task 9: lesson.js — 10 шагов урока

**Files:**
- Create: `js/lesson.js`
- Modify: `js/main.js` (создать lesson, подключить кнопки)

**Interfaces:**
- Consumes: `app` (Task 8), `CITIES` (Task 7), `tween`, `tweenCamera`, `cancelAllTweens` (Task 3), `fmtLat/fmtLon/fmtCoords/latLonToXYZ` (Task 2), `grat.pulseMeridian180(tween)` (Task 5).
- Produces: `createLesson(app) → { goto(n) }`; тексты шагов — дословно из спеки.

- [ ] **Step 1: js/lesson.js**

```js
import { tween, cancelAllTweens } from './tween.js';
import { CITIES } from './cities.js';
import { fmtCoords, latLonToXYZ } from './coords.js';

const MOSCOW = CITIES[0];
const RIO = CITIES.find((c) => c.name === 'Рио-де-Жанейро');
const NY = CITIES.find((c) => c.name === 'Нью-Йорк');
const GREENWICH = { lat: 51.4779, lon: 0 };

// позиция камеры «в плоскости меридиана lon» — чтобы угол читался как на транспортире
function cameraInMeridian(lon, y = 0.25) {
  const p = latLonToXYZ(0, lon + 90, 3.3);
  return { pos: [p.x, y, p.z], target: [0, 0, 0] };
}

export const LESSON_STEPS = [
  {
    title: 'Это Земля',
    text: 'Это наша планета Земля. У каждой точки на ней есть точный адрес — как у дома. Сейчас узнаем, как его записывают!',
    camera: { pos: [0, 0.8, 3.2], target: [0, 0, 0] },
    enter(app) {
      app.controls.autoRotate = true;
      app.controls.autoRotateSpeed = 0.5;
    },
  },
  {
    title: 'Ось и полюса',
    text: 'Земля вращается вокруг воображаемой оси. Точки, где ось выходит из Земли, — Северный и Южный полюса.',
    camera: { pos: [2.2, 1.6, 2.2], target: [0, 0, 0] },
    enter(app) { app.globe.axisGroup.visible = true; },
  },
  {
    title: 'Экватор',
    text: 'Посередине между полюсами — главная линия: экватор. Он делит Землю на Северное и Южное полушария.',
    camera: { pos: [0, 1.2, 3.1], target: [0, 0, 0] },
    async enter(app) {
      app.globe.axisGroup.visible = true;
      app.grat.setLayers({ equator: true });
      const { north, south } = app.globe.shells;
      for (let i = 0; i < 2; i++) {
        await tween(700, (k) => north.setGlow(Math.sin(k * Math.PI)));
        await tween(700, (k) => south.setGlow(Math.sin(k * Math.PI)));
      }
      north.setGlow(0); south.setGlow(0);
    },
  },
  {
    title: 'Параллели',
    text: 'Параллели — круги параллельно экватору. Чем ближе к полюсу, тем круг меньше. По ним будем считать широту.',
    camera: { pos: [0, 1.6, 3.0], target: [0, 0, 0] },
    enter(app) {
      app.globe.axisGroup.visible = true;
      app.grat.setLayers({ equator: true, parallels: true });
    },
  },
  {
    title: 'Измеряем широту',
    text: 'Широта — угол от экватора до точки. От экватора вверх до Москвы — 56°. Это 56° северной широты. Вверх — северная (с.ш.), вниз — южная (ю.ш.), от 0° до 90°.',
    camera: cameraInMeridian(MOSCOW.lon),
    async enter(app) {
      app.grat.setLayers({ equator: true, parallels: true });
      app.marker.setLatLon(MOSCOW.lat, MOSCOW.lon);
      app.marker.show();
      await app.sleepTracked(600);
      await app.arcs.lat.grow(MOSCOW.lat, MOSCOW.lon, 1800);
      await app.sleepTracked(1400);
      await app.tweenCamera(cameraInMeridian(RIO.lon), 1100);
      app.arcs.lat.hide();
      app.marker.setLatLon(RIO.lat, RIO.lon);
      await app.sleepTracked(400);
      await app.arcs.lat.grow(RIO.lat, RIO.lon, 1500);
    },
  },
  {
    title: 'Нулевой меридиан',
    text: 'Договорились: меридиан, проходящий через Гринвич (рядом с Лондоном), — это 0° долготы. От него и считают.',
    camera: { pos: [0.7, 1.2, 3.0], target: [0, 0, 0] },
    enter(app) {
      app.globe.axisGroup.visible = false;
      app.grat.setLayers({ greenwich: true });
      app.marker.setLatLon(GREENWICH.lat, GREENWICH.lon);
      app.marker.show();
    },
  },
  {
    title: 'Меридианы',
    text: 'Меридианы соединяют полюса, как дольки апельсина. Все они одинаковой длины.',
    camera: { pos: [0, 2.2, 2.4], target: [0, 0, 0] },
    enter(app) {
      app.globe.axisGroup.visible = true;
      app.grat.setLayers({ greenwich: true, meridians: true });
      app.marker.hide();
    },
  },
  {
    title: 'Измеряем долготу',
    text: 'Долгота — угол от Гринвичского меридиана до меридиана точки. От Гринвича на восток до Москвы — 38° восточной долготы (в.д.). На восток — в.д., на запад — з.д. Считают до 180°: половина круга на восток, половина на запад.',
    camera: cameraInMeridian(MOSCOW.lon / 2 + 90, 0.4),
    async enter(app) {
      app.grat.setLayers({ equator: true, greenwich: true, meridians: true });
      app.marker.setLatLon(MOSCOW.lat, MOSCOW.lon);
      app.marker.show();
      await app.sleepTracked(500);
      await app.arcs.lon.grow(MOSCOW.lon, 1800);
      await app.sleepTracked(1400);
      await app.tweenCamera(cameraInMeridian(NY.lon / 2 + 90, 0.4), 1100);
      app.arcs.lon.hide();
      await app.sleepTracked(300);
      await app.arcs.lon.grow(NY.lon, 1600); // на запад, «74° з.д.»
      await app.sleepTracked(900);
      await app.grat.pulseMeridian180(tween);
    },
  },
  {
    title: 'Координаты — адрес точки',
    text: 'Место, где пересекаются параллель 56° с.ш. и меридиан 38° в.д., — Москва. Широта и долгота вместе — это географические координаты, адрес точки на Земле!',
    camera: { pos: [1.8, 1.4, 2.4], target: [0, 0, 0] },
    enter(app) {
      app.grat.setLayers({ equator: true, greenwich: true, parallels: true, meridians: true });
      app.grat.setMeridian180(false);
      app.marker.setLatLon(MOSCOW.lat, MOSCOW.lon);
      app.marker.show();
      app.arcs.lat.set(MOSCOW.lat, MOSCOW.lon);
      app.arcs.lon.set(MOSCOW.lon);
      app.grat.setPointHighlight(MOSCOW.lat, MOSCOW.lon);
      app.ui.lessonExtra.textContent = `Москва: ${fmtCoords(MOSCOW.lat, MOSCOW.lon)}`;
    },
  },
  {
    title: 'Проверь себя!',
    text: 'А теперь попробуй сам находить точки по координатам!',
    camera: { pos: [0, 0.8, 3.2], target: [0, 0, 0] },
    enter(app) {
      app.grat.setLayers({ equator: true, greenwich: true });
      app.marker.hide();
      app.arcs.lat.hide();
      app.arcs.lon.hide();
      app.grat.setPointHighlight(null);
      app.ui.btnPlay.hidden = false;
    },
  },
];

export function createLesson(app) {
  function resetScene() {
    app.controls.autoRotate = false;
    app.globe.axisGroup.visible = false;
    app.globe.shells.north.setGlow(0);
    app.globe.shells.south.setGlow(0);
    app.grat.setLayers({});
    app.grat.setMeridian180(false);
    app.grat.setPointHighlight(null);
    app.arcs.lat.hide();
    app.arcs.lon.hide();
    app.marker.hide();
    app.citiesLayer.visible = false;
    app.cityHoverLabel.sprite.visible = false;
    app.ui.lessonExtra.textContent = '';
    app.ui.btnPlay.hidden = true;
    app.ui.gameNext.hidden = true;
  }

  async function goto(n) {
    cancelAllTweens();
    resetScene();
    n = Math.max(0, Math.min(LESSON_STEPS.length - 1, n));
    app.state.step = n;
    const s = LESSON_STEPS[n];
    app.ui.lessonTitle.textContent = s.title;
    app.ui.lessonText.textContent = s.text;
    app.ui.lessonProgress.textContent = `Шаг ${n + 1} из ${LESSON_STEPS.length}`;
    app.ui.btnPrev.disabled = n === 0;
    app.ui.btnNext.disabled = n === LESSON_STEPS.length - 1;
    await app.tweenCamera(s.camera, 1100);
    await s.enter?.(app);
  }

  app.ui.btnPrev.addEventListener('click', () => goto(app.state.step - 1));
  app.ui.btnNext.addEventListener('click', () => goto(app.state.step + 1));
  app.ui.btnPlay.addEventListener('click', () => app.setMode('game'));

  return { goto };
}
```

- [ ] **Step 2: main.js — создать lesson**

Заменить `const lesson = null;`:
```js
import { createLesson } from './lesson.js';
// после создания app и freeplay:
const lesson = createLesson(app);
app.gotoStep = (n) => lesson.goto(n);
lesson.goto(0);
```
(Порядок: lesson создаётся до первого `setMode`, поэтому объявление `let lesson` поднимается выше обработчиков; финальная структура: `let lesson, game;` → создание freeplay → lesson → game (Task 10) → обработчики режимов.)

- [ ] **Step 3: Пройти урок в браузере, снять скриншоты каждого шага**

Скрипт: `for (let i = 0; i < 10; i++) { await window.__app.gotoStep(i); await new Promise(r => setTimeout(r, 4000)); }` — скриншот после каждого шага (пауза 4с, чтобы анимации доиграли). Проверить глазами на скриншотах:
- шаг 2: красный экватор, полушария моргают;
- шаг 4: оранжевая дуга «56° с.ш.» у Москвы, потом «23° ю.ш.» у Рио;
- шаг 7: зелёная дуга «38° в.д.», потом «74° з.д.», потом жёлтый 180-й пульсирует;
- шаг 8: оба угла + подсвеченные параллель/меридиан + «Москва: 56° с.ш., 38° в.д.»;
- «Назад» на шаге 4 восстанавливает сцену без остатков (нет лишних дуг, маркер на месте).
Консоль чистая.

- [ ] **Step 4: Commit**

```bash
git add js/lesson.js js/main.js
git commit -m "feat: пошаговый урок из 10 сцен с анимациями измерения широты и долготы"
```

---

### Task 10: game.js — мини-игра «Найди точку»

**Files:**
- Create: `js/game.js`
- Modify: `js/main.js` (создать game, клики по сфере в режиме игры)

**Interfaces:**
- Consumes: `app` (Task 8), `CITIES`, `fmtCoords`, `roundDeg`, `angularDistanceDeg`, `starsForError` (Task 2).
- Produces: `createGame(app) → { enter() }`.
- Правила: 8 раундов, случайные города без повторов; клик по глобусу = ответ; после ответа: жёлтый маркер игрока, зелёная точка-ответ, обе дуги к ответу, «Это {город}! Ошибка: N°» + звёзды ⭐/✩ (пороги из `starsForError`); финал «Твои звёзды: S из 24» + «Ещё раз».

- [ ] **Step 1: js/game.js**

```js
import { CITIES } from './cities.js';
import { latLonToXYZ, fmtCoords, roundDeg, angularDistanceDeg, starsForError } from './coords.js';

function shuffle(a) {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function createGame(app) {
  const { ui, grat, arcs, marker, state } = app;
  let order = [], idx = 0, score = 0, answered = false;

  // зелёная точка правильного ответа
  const answerPin = new app.THREE.Mesh(
    new app.THREE.SphereGeometry(0.03, 14, 10),
    new app.THREE.MeshBasicMaterial({ color: 0x57cc99 })
  );
  answerPin.visible = false;
  app.scene.add(answerPin);

  function newRound() {
    answered = false;
    const city = order[idx];
    ui.gameTask.textContent = `Найди: ${fmtCoords(city.lat, city.lon)}`;
    ui.gameProgress.textContent = `Раунд ${idx + 1} из ${order.length} · ⭐ ${score}`;
    ui.gameResult.textContent = 'Кликни по глобусу в том месте, о котором идёт речь';
    ui.gameNext.hidden = true;
    ui.gameFinal.hidden = true;
    answerPin.visible = false;
    grat.setLayers({ equator: true, greenwich: true });
    grat.setPointHighlight(null);
    arcs.lat.hide();
    arcs.lon.hide();
    marker.hide();
  }

  async function handleAnswer(lat, lon) {
    if (answered) return;
    answered = true;
    const city = order[idx];
    const err = angularDistanceDeg(lat, lon, city.lat, city.lon);
    const stars = starsForError(err);
    score += stars;
    marker.setLatLon(lat, lon);
    marker.show();
    const pos = latLonToXYZ(city.lat, city.lon, 1.02);
    answerPin.position.set(pos.x, pos.y, pos.z);
    answerPin.visible = true;
    ui.gameResult.innerHTML =
      `Это <b>${city.name}</b>! Ошибка: ${roundDeg(err)}°<br>` +
      '⭐'.repeat(stars) + '✩'.repeat(3 - stars);
    ui.gameProgress.textContent = `Раунд ${idx + 1} из ${order.length} · ⭐ ${score}`;
    await arcs.lat.grow(city.lat, city.lon, 900);
    await arcs.lon.grow(city.lon, 900);
    ui.gameNext.hidden = false;
  }

  function next() {
    idx++;
    if (idx < order.length) newRound();
    else {
      ui.gameTask.textContent = 'Игра пройдена!';
      ui.gameResult.textContent = '';
      ui.gameNext.hidden = true;
      ui.gameScore.textContent = `Твои звёзды: ${score} из ${order.length * 3}`;
      ui.gameFinal.hidden = false;
    }
  }

  ui.gameNext.addEventListener('click', next);
  ui.gameRestart.addEventListener('click', () => enter());

  function enter() {
    order = shuffle(CITIES).slice(0, 8);
    idx = 0;
    score = 0;
    newRound();
  }

  return { enter, handleAnswer };
}
```
(Убрать случайную строку `const p = … ? answerPin : answerPin;` — это артефакт; сразу `const pos = latLonToXYZ(city.lat, city.lon, 1.02)` с обычным импортом вверху файла: `import { latLonToXYZ, fmtCoords, roundDeg, angularDistanceDeg, starsForError } from './coords.js';`)

- [ ] **Step 2: main.js — клики в игре**

```js
import { createGame } from './game.js';
const game = createGame(app);

let downXY = null;
renderer.domElement.addEventListener('pointerdown', (e) => { downXY = [e.clientX, e.clientY]; });
renderer.domElement.addEventListener('pointerup', (e) => {
  if (state.mode !== 'game' || !downXY) return;
  const moved = Math.hypot(e.clientX - downXY[0], e.clientY - downXY[1]);
  downXY = null;
  if (moved > 6) return; // это было вращение глобуса, не клик
  const ll = raycastSphere(e);
  if (ll) game.handleAnswer(ll.lat, ll.lon);
});
```

- [ ] **Step 3: Проверить игру в браузере**

1. `window.__app.setMode('game')` — задача вида «Найди: 23° ю.ш., 43° з.д.».
2. Клик рядом с правильным местом (через evaluate_script: dispatchEvent PointerEvent на canvas с координатами пикселя Рио — координаты вычислить приближённо, или кликнуть по экватору «для ошибки») — появляется результат со звёздами и городом, дуги растут к ответу.
3. «Дальше →» 8 раз — финальный экран «Твои звёзды: S из 24», «Ещё раз» перезапускает.
4. Консоль чистая. Скриншоты: раунд с ответом, финальный экран.

- [ ] **Step 4: Commit**

```bash
git add js/game.js js/main.js
git commit -m "feat: мини-игра «Найди точку» — 8 раундов, звёзды, дуги к ответу"
```

---

### Task 11: Финальное QA + приёмка

**Files:**
- Modify: при найденных проблемах — соответствующие файлы.

- [ ] **Step 1: Чек-лист приёмки (по спеке, раздел 10)**

Прогнать всё в chrome-devtools MCP (сервер на 8137):
1. Консоль без ошибок после полной сессии (урок → свободно → игра).
2. Урок: все 10 шагов вперёд, потом назад до 0 — сцена консистентна (скриншоты).
3. Дуги: широта 0→56° в плоскости меридиана; долгота 0→38° в плоскости экватора; начало отсчёта видно (экватор/Гринвич).
4. Свободный режим: `flyMarker(55.7558, 37.6173)` → readout «56° с.ш., 38° в.д.»; слайдеры синхронны в обе стороны.
5. Игра: раунды, звёзды, финал, рестарт.
6. Офлайн: `list_network_requests` после загрузки — только localhost, внешних запросов нет.
7. Русские подписи и нотация градусов — на скриншотах.
8. FPS: панель не нужна, но визуально плавно (анимации без фризов) — оценка по видеозаписи/наблюдению.

- [ ] **Step 2: Исправить найденное, перезапустить чек-лист**

- [ ] **Step 3: Финальный коммит**

```bash
git add -A
git commit -m "chore: финальное QA — приёмка по чек-листу спеки"
```

---

## Self-Review (выполнен после написания)

- **Spec coverage:** урок (спека §4 → Task 9), сектора-углы (§2 → Task 6), сцена/цвета (§3 → Tasks 4–6), свободный режим (§5.2 → Task 8), игра (§5.3 → Task 10), города (§6 → Task 7), UI (§7 → Task 1+8), архитектура (§8 → все задачи), ошибки WebGL/файл (§9 → Tasks 1, 4), приёмка (§10 → Task 11). Не реализуется (по §11, осознанно): минуты/секунды, наклон оси, линия перемены дат, день/ночь, 111 км.
- **Placeholder scan:** чисто — все шаги содержат код или точные команды; ранее найденные артефакты в коде game.js/freeplay.js исправлены в тексте плана.
- **Type consistency:** имена проверены по цепочкам: `grat.setLayers/setMeridian180/pulseMeridian180(tween)/setPointHighlight`, `arcs.lat.grow(lat, lon, ms)/set(lat, lon)`, `arcs.lon.grow(lon, ms)/set(lon)`, `marker.setLatLon/show/hide/hit`, `app.raycastSphere/raycastMarker/sleepTracked/tweenCamera/flyMarker/setMode/gotoStep`, `fmtLat/fmtLon/fmtCoords/roundDeg/angularDistanceDeg/starsForError`, `globe.axisGroup/shells.north.setGlow/sphereMesh`.
