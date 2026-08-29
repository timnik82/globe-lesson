import * as THREE from 'three';
import { latLonToXYZ } from './coords.js';
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
  return new THREE.Mesh(
    new THREE.TubeGeometry(curve, 220, radius, 8, closed),
    new THREE.MeshBasicMaterial({ color })
  );
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
    parallels.add(thinLine(circle(lat, 1.002), 0xd9a45b));
    const lab = makeLabelSprite(`${Math.abs(lat)}°`, { size: 20, color: '#d9a45b', bg: 'rgba(11,21,48,0.55)', scale: 0.7 });
    const p = latLonToXYZ(lat, 0, 1.06);
    lab.position.set(p.x, p.y, p.z);
    parallels.add(lab);
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

  const greenwich = tubeFrom(
    meridianSeg(0, 1.004).concat(meridianSeg(180, 1.004).reverse()), false, 0.006, 0x2a9d4f
  );
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
      try {
        await tween(2400, (k) => { mat.opacity = 0.35 + 0.65 * Math.abs(Math.sin(k * Math.PI * 3)); });
      } finally {
        mat.opacity = 1; // даже если пульс отменили посреди — линия не остаётся «полупрозрачной»
      }
    },
    setPointHighlight(lat, lon) {
      if (lat === null) { hiPar.visible = hiMer.visible = false; return; }
      rebuild(hiPar, circle(lat, 1.004), true);
      rebuild(hiMer, meridianSeg(lon, 1.004), false);
      hiPar.visible = hiMer.visible = true;
    },
  };
}
