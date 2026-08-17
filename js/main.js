import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';
import { createGlobe } from './globe.js';
import { createGraticule } from './graticule.js';
import { createArcs } from './angles.js';
import { CITIES } from './cities.js';
import { createMarker } from './marker.js';
import { latLonToXYZ, xyzToLatLon } from './coords.js';
import { makeDynamicLabel } from './labels.js';

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

const globe = await createGlobe(scene);
const grat = createGraticule(scene);
grat.setLayers({ parallels: true, meridians: true, equator: true, greenwich: true }); // временно, для проверки
const arcs = createArcs(scene);
globe.setGlass(true); // временно, для проверки
arcs.lat.grow(55.7558, 37.6173, 2000).then(() => arcs.lon.grow(37.6173, 2000)); // временно, для проверки

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

marker.setLatLon(55.7558, 37.6173); // временно, для проверки
marker.show();
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

// временный отладочный хук (убрать в задаче 8)
window.__debug = { renderer, scene, camera, globe };

// временная проверка tween + labels (задача 3)
import { makeLabelSprite } from './labels.js';
import { tween } from './tween.js';
const testLabel = makeLabelSprite('тест подписи', { color: '#ffd166' });
testLabel.position.set(0, 1.3, 0);
scene.add(testLabel);
tween(2000, (k) => { testLabel.material.opacity = 0.3 + 0.7 * Math.abs(Math.sin(k * Math.PI * 3)); });
