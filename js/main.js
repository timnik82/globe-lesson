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

// временная проверка tween + labels (задача 3)
import { makeLabelSprite } from './labels.js';
import { tween } from './tween.js';
const testLabel = makeLabelSprite('тест подписи', { color: '#ffd166' });
testLabel.position.set(0, 1.3, 0);
scene.add(testLabel);
tween(2000, (k) => { testLabel.material.opacity = 0.3 + 0.7 * Math.abs(Math.sin(k * Math.PI * 3)); });
