import * as THREE from 'three';

export const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

const active = new Set();

export function tween(ms, onUpdate, ease = easeInOut) {
  return new Promise((resolve) => {
    const rec = { stop: false };
    active.add(rec);
    const t0 = performance.now();
    requestAnimationFrame(function frame(now) {
      if (rec.stop) { active.delete(rec); resolve(false); return; }
      const t = Math.min(1, (now - t0) / ms);
      onUpdate(ease(t), t);
      if (t < 1) requestAnimationFrame(frame);
      else { active.delete(rec); resolve(true); }
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
  const finished = await tween(ms, (k) => {
    camera.position.lerpVectors(p0, p1, k);
    controls.target.lerpVectors(t0, t1, k);
    controls.update();
  });
  // отменённый полёт не должен возвращать управление — его вернёт тот,
  // кто стартует следующий полёт, или setMode (иначе полёты дерутся)
  if (finished) controls.enabled = true;
}
