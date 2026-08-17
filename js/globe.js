import * as THREE from 'three';
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
