import { tween, cancelAllTweens } from './tween.js';
import { CITIES, cityName } from './cities.js';
import { fmtCoords, latLonToXYZ } from './coords.js';
import { t } from './i18n.js';

const MOSCOW = CITIES[0];
const RIO = CITIES.find((c) => c.id === 'rio');
const NY = CITIES.find((c) => c.id === 'newyork');
const GREENWICH = { lat: 51.4779, lon: 0 };

// камера лицом к плоскости меридиана lon — чтобы угол читался как на транспортире
function cameraInMeridian(lon, y = 0.25) {
  const p = latLonToXYZ(0, lon + 90, 3.3);
  return { pos: [p.x, y, p.z], target: [0, 0, 0] };
}

export const LESSON_STEPS = [
  {
    id: 'earth',
    camera: { pos: [0, 0.8, 3.2], target: [0, 0, 0] },
    enter(app) {
      app.ui.lessonExtra.textContent = t('lesson.spinHint');
      app.controls.autoRotate = true;
      app.controls.autoRotateSpeed = 0.5;
    },
  },
  {
    id: 'axis',
    camera: { pos: [2.2, 1.6, 2.2], target: [0, 0, 0] },
    enter(app) { app.globe.axisGroup.visible = true; },
  },
  {
    id: 'equator',
    camera: { pos: [0, 1.2, 3.1], target: [0, 0, 0] },
    async enter(app) {
      app.globe.axisGroup.visible = true;
      app.grat.setLayers({ equator: true });
      const { north, south } = app.globe.shells;
      for (let i = 0; i < 2; i++) {
        await app.tween(700, (k) => north.setGlow(Math.sin(k * Math.PI)));
        await app.tween(700, (k) => south.setGlow(Math.sin(k * Math.PI)));
      }
      north.setGlow(0); south.setGlow(0);
    },
  },
  {
    id: 'parallels',
    camera: { pos: [0, 1.6, 3.0], target: [0, 0, 0] },
    enter(app) {
      app.globe.axisGroup.visible = true;
      app.grat.setLayers({ equator: true, parallels: true });
    },
  },
  {
    id: 'measureLat',
    camera: cameraInMeridian(MOSCOW.lon),
    async enter(app) {
      app.grat.setLayers({ equator: true, parallels: true });
      app.globe.setGlass(true);
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
    id: 'primeMeridian',
    camera: { pos: [0.7, 1.2, 3.0], target: [0, 0, 0] },
    enter(app) {
      app.globe.setGlass(false);
      app.globe.axisGroup.visible = false;
      app.grat.setLayers({ greenwich: true });
      app.marker.setLatLon(GREENWICH.lat, GREENWICH.lon);
      app.marker.show();
    },
  },
  {
    id: 'meridians',
    camera: { pos: [0, 2.2, 2.4], target: [0, 0, 0] },
    enter(app) {
      app.globe.axisGroup.visible = true;
      app.grat.setLayers({ greenwich: true, meridians: true });
      app.marker.hide();
    },
  },
  {
    id: 'measureLon',
    camera: cameraInMeridian(MOSCOW.lon / 2 - 90, 0.4),
    async enter(app) {
      app.grat.setLayers({ equator: true, greenwich: true, meridians: true });
      app.globe.setGlass(true);
      app.marker.setLatLon(MOSCOW.lat, MOSCOW.lon);
      app.marker.show();
      await app.sleepTracked(500);
      await app.arcs.lon.grow(MOSCOW.lon, 1800);
      await app.sleepTracked(1400);
      await app.tweenCamera(cameraInMeridian(NY.lon / 2 - 90, 0.4), 1100);
      app.arcs.lon.hide();
      app.marker.setLatLon(NY.lat, NY.lon); // второй пример — булавка переезжает в Нью-Йорк
      await app.sleepTracked(300);
      await app.arcs.lon.grow(NY.lon, 1600); // на запад, «74° з.д.»
      await app.sleepTracked(900);
      await app.grat.pulseMeridian180(app.tween);
    },
  },
  {
    id: 'coords',
    camera: { pos: [1.8, 1.4, 2.4], target: [0, 0, 0] },
    enter(app) {
      app.grat.setLayers({ equator: true, greenwich: true, parallels: true, meridians: true });
      app.grat.setMeridian180(false);
      app.globe.setGlass(true);
      app.marker.setLatLon(MOSCOW.lat, MOSCOW.lon);
      app.marker.show();
      app.arcs.lat.set(MOSCOW.lat, MOSCOW.lon);
      app.arcs.lon.set(MOSCOW.lon);
      app.grat.setPointHighlight(MOSCOW.lat, MOSCOW.lon);
      app.ui.lessonExtra.textContent = t('lesson.cityCoords', {
        city: cityName(MOSCOW),
        coords: fmtCoords(MOSCOW.lat, MOSCOW.lon),
      });
    },
  },
  {
    id: 'quiz',
    camera: { pos: [0, 0.8, 3.2], target: [0, 0, 0] },
    enter(app) {
      app.globe.setGlass(false);
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
    app.globe.setGlass(false);
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
  }

  // Защита от гонок: у каждого goto свой номер поколения. Анимации шага ждут
  // через защищённые хелперы — как только поколение сменилось, они отклоняются
  // со STALE и цепочка старого шага умирает, не трогая сцену нового.
  let runId = 0;
  const STALE = Symbol('stale');

  function makeStepTools() {
    const id = runId;
    const stale = () => id !== runId;
    return {
      sleepTracked: (ms) => new Promise((res, rej) => {
        if (stale()) { rej(STALE); return; }
        setTimeout(() => (stale() ? rej(STALE) : res()), ms);
      }),
      tween: (ms, fn) => {
        if (stale()) return Promise.reject(STALE);
        return tween(ms, fn).then((finished) => {
          if (!finished || stale()) throw STALE;
        });
      },
      tweenCamera: (cam, ms) => {
        if (stale()) return Promise.reject(STALE);
        return app.tweenCamera(cam, ms).then(() => {
          if (stale()) throw STALE;
        });
      },
    };
  }

  async function goto(n) {
    const myRun = ++runId;
    const stale = () => myRun !== runId;
    cancelAllTweens();
    app.controls.enabled = true; // отменённые полёты управление не возвращают
    resetScene();
    n = Math.max(0, Math.min(LESSON_STEPS.length - 1, n));
    app.state.step = n;
    const s = LESSON_STEPS[n];
    app.ui.lessonTitle.textContent = t(`lesson.steps.${s.id}.title`);
    app.ui.lessonText.textContent = t(`lesson.steps.${s.id}.text`);
    app.ui.lessonProgress.textContent = t('lesson.progress', { n: n + 1, m: LESSON_STEPS.length });
    app.ui.btnPrev.disabled = n === 0;
    app.ui.btnNext.disabled = n === LESSON_STEPS.length - 1;
    await app.tweenCamera(s.camera, 1100);
    if (stale()) return;
    const tools = makeStepTools();
    const ctx = Object.create(app);
    Object.assign(ctx, tools);
    try {
      await s.enter?.(ctx);
    } catch (e) {
      if (e !== STALE) console.error(e);
    }
  }

  app.ui.btnPrev.addEventListener('click', () => goto(app.state.step - 1));
  app.ui.btnNext.addEventListener('click', () => goto(app.state.step + 1));
  app.ui.btnPlay.addEventListener('click', () => app.setMode('game'));

  return {
    goto,
    // выход из режима урока посреди анимации — убить цепочку шага
    invalidate: () => { runId++; },
  };
}
