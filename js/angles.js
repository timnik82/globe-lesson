import * as THREE from 'three';
import { latLonToXYZ, fmtLat, fmtLon, DEG } from './coords.js';
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
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false })
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
