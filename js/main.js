import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';
import { latLonToXYZ, xyzToLatLon } from './coords.js';
import { createGlobe } from './globe.js';
import { createGraticule } from './graticule.js';
import { createArcs } from './angles.js';
import { createMarker } from './marker.js';
import { CITIES } from './cities.js';
import { makeDynamicLabel } from './labels.js';
import { tween, cancelAllTweens, tweenCamera } from './tween.js';
import { createFreeplay } from './freeplay.js';

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

scene.add(new THREE.AmbientLight(0xffffff, 1.6));
const dir = new THREE.DirectionalLight(0xffffff, 1.2);
dir.position.set(2, 1.5, 3);
scene.add(dir);

const globe = await createGlobe(scene);
const grat = createGraticule(scene);
const arcs = createArcs(scene);
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

// рейкаст
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

// UI
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

let lesson = null; // создаётся в задаче 9
let game = null;   // создаётся в задаче 10

const app = {
  THREE, scene, camera, renderer, controls, globe, grat, arcs, marker,
  citiesLayer, cityHoverLabel, raycastSphere, raycastMarker, state, ui,
  sleepTracked,
  tweenCamera: (opts, ms) => tweenCamera(camera, controls, opts, ms),
  setMode,
  gotoStep: (n) => lesson && lesson.goto(n),
  async flyMarker(lat, lon) {
    const lat0 = state.lat, lon0 = state.lon;
    let dLon = lon - lon0;
    if (dLon > 180) dLon -= 360;
    if (dLon < -180) dLon += 360;
    cancelAllTweens();
    await tween(800, (k) => {
      freeplay.update(lat0 + (lat - lat0) * k, lon0 + dLon * k);
    });
  },
};

const freeplay = createFreeplay(app);

// перетаскивание маркера (только в свободном режиме)
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
  if (dragging) {
    dragging = false;
    controls.enabled = true;
    renderer.domElement.style.cursor = 'default';
  }
});

// клик по глобусу в игре
let downXY = null;
renderer.domElement.addEventListener('pointerdown', (e) => { downXY = [e.clientX, e.clientY]; });
renderer.domElement.addEventListener('pointerup', (e) => {
  if (state.mode !== 'game' || !downXY) return;
  const moved = Math.hypot(e.clientX - downXY[0], e.clientY - downXY[1]);
  downXY = null;
  if (moved > 6) return; // это было вращение глобуса, не клик
  const ll = raycastSphere(e);
  if (ll && game) game.handleAnswer(ll.lat, ll.lon);
});

// переключение режимов
function setMode(mode) {
  cancelAllTweens();
  clearTracked();
  state.mode = mode;
  for (const id of ['lesson', 'free', 'game']) {
    document.getElementById('mode-' + id).classList.toggle('active', mode === id);
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

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

renderer.setAnimationLoop(() => { controls.update(); renderer.render(scene, camera); });

window.__app = app; // хук для QA-проверок
