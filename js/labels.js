import * as THREE from 'three';

function draw(canvas, text, { size, color, bg, pad }) {
  // willReadFrequently → софтверный канвас: GPU-поверхности нет, и текстура
  // после ресайза заливается целиком. Без него Chromium копирует текстуру
  // частями со старыми размерами (GL_INVALID_VALUE) и на глобусе остаётся
  // смесь старого и нового текста
  const c = canvas.getContext('2d', { willReadFrequently: true });
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
    lastText: '',
    setText(text) {
      if (text === this.lastText) return; // без работы — без новой текстуры
      this.lastText = text;
      const { w: nw, h: nh } = draw(canvas, text, o);
      // needsUpdate после первого аплоада в Chrome не перезаливает канвас
      // надёжно (видели и зависший текст, и «хвосты» старых строк) —
      // пересоздаём текстуру целиком, это единственный стабильный путь
      spr.material.map.dispose();
      spr.material.map = new THREE.CanvasTexture(canvas);
      spr.material.map.colorSpace = THREE.SRGBColorSpace;
      spr.userData.setSize(nw, nh);
    },
  };
}

export function makeLabelSprite(text, opts = {}) {
  const lab = makeDynamicLabel(opts);
  lab.setText(text);
  return lab.sprite;
}
