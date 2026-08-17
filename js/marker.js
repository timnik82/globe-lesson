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
