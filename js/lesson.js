import { tween, cancelAllTweens } from './tween.js';
import { CITIES } from './cities.js';
import { fmtCoords, latLonToXYZ } from './coords.js';

const MOSCOW = CITIES[0];
const RIO = CITIES.find((c) => c.name === 'Рио-де-Жанейро');
const NY = CITIES.find((c) => c.name === 'Нью-Йорк');
const GREENWICH = { lat: 51.4779, lon: 0 };

// камера лицом к плоскости меридиана lon — чтобы угол читался как на транспортире
function cameraInMeridian(lon, y = 0.25) {
  const p = latLonToXYZ(0, lon + 90, 3.3);
  return { pos: [p.x, y, p.z], target: [0, 0, 0] };
}

export const LESSON_STEPS = [
  {
    title: 'Это Земля',
    text: 'Это наша планета Земля. У каждой точки на ней есть точный адрес — как у дома. Сейчас узнаем, как его записывают!',
    camera: { pos: [0, 0.8, 3.2], target: [0, 0, 0] },
    enter(app) {
      app.controls.autoRotate = true;
      app.controls.autoRotateSpeed = 0.5;
    },
  },
  {
    title: 'Ось и полюса',
    text: 'Земля вращается вокруг воображаемой оси. Точки, где ось выходит из Земли, — Северный и Южный полюса.',
    camera: { pos: [2.2, 1.6, 2.2], target: [0, 0, 0] },
    enter(app) { app.globe.axisGroup.visible = true; },
  },
  {
    title: 'Экватор',
    text: 'Посередине между полюсами — главная линия: экватор. Он делит Землю на Северное и Южное полушария.',
    camera: { pos: [0, 1.2, 3.1], target: [0, 0, 0] },
    async enter(app) {
      app.globe.axisGroup.visible = true;
      app.grat.setLayers({ equator: true });
      const { north, south } = app.globe.shells;
      for (let i = 0; i < 2; i++) {
        await tween(700, (k) => north.setGlow(Math.sin(k * Math.PI)));
        await tween(700, (k) => south.setGlow(Math.sin(k * Math.PI)));
      }
      north.setGlow(0); south.setGlow(0);
    },
  },
  {
    title: 'Параллели',
    text: 'Параллели — круги параллельно экватору. Чем ближе к полюсу, тем круг меньше. По ним будем считать широту.',
    camera: { pos: [0, 1.6, 3.0], target: [0, 0, 0] },
    enter(app) {
      app.globe.axisGroup.visible = true;
      app.grat.setLayers({ equator: true, parallels: true });
    },
  },
  {
    title: 'Измеряем широту',
    text: 'Широта — угол от экватора до точки. От экватора вверх до Москвы — 56°. Это 56° северной широты. Вверх — северная (с.ш.), вниз — южная (ю.ш.), от 0° до 90°.',
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
    title: 'Нулевой меридиан',
    text: 'Договорились: меридиан, проходящий через Гринвич (рядом с Лондоном), — это 0° долготы. От него и считают.',
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
    title: 'Меридианы',
    text: 'Меридианы соединяют полюса, как дольки апельсина. Все они одинаковой длины.',
    camera: { pos: [0, 2.2, 2.4], target: [0, 0, 0] },
    enter(app) {
      app.globe.axisGroup.visible = true;
      app.grat.setLayers({ greenwich: true, meridians: true });
      app.marker.hide();
    },
  },
  {
    title: 'Измеряем долготу',
    text: 'Долгота — угол от Гринвичского меридиана до меридиана точки. От Гринвича на восток до Москвы — 38° восточной долготы (в.д.). На восток — в.д., на запад — з.д. Считают до 180°: половина круга на восток, половина на запад.',
    camera: cameraInMeridian(MOSCOW.lon / 2 + 90, 0.4),
    async enter(app) {
      app.grat.setLayers({ equator: true, greenwich: true, meridians: true });
      app.globe.setGlass(true);
      app.marker.setLatLon(MOSCOW.lat, MOSCOW.lon);
      app.marker.show();
      await app.sleepTracked(500);
      await app.arcs.lon.grow(MOSCOW.lon, 1800);
      await app.sleepTracked(1400);
      await app.tweenCamera(cameraInMeridian(NY.lon / 2 + 90, 0.4), 1100);
      app.arcs.lon.hide();
      await app.sleepTracked(300);
      await app.arcs.lon.grow(NY.lon, 1600); // на запад, «74° з.д.»
      await app.sleepTracked(900);
      await app.grat.pulseMeridian180(tween);
    },
  },
  {
    title: 'Координаты — адрес точки',
    text: 'Место, где пересекаются параллель 56° с.ш. и меридиан 38° в.д., — Москва. Широта и долгота вместе — это географические координаты, адрес точки на Земле!',
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
      app.ui.lessonExtra.textContent = `Москва: ${fmtCoords(MOSCOW.lat, MOSCOW.lon)}`;
    },
  },
  {
    title: 'Проверь себя!',
    text: 'А теперь попробуй сам находить точки по координатам!',
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

  async function goto(n) {
    cancelAllTweens();
    resetScene();
    n = Math.max(0, Math.min(LESSON_STEPS.length - 1, n));
    app.state.step = n;
    const s = LESSON_STEPS[n];
    app.ui.lessonTitle.textContent = s.title;
    app.ui.lessonText.textContent = s.text;
    app.ui.lessonProgress.textContent = `Шаг ${n + 1} из ${LESSON_STEPS.length}`;
    app.ui.btnPrev.disabled = n === 0;
    app.ui.btnNext.disabled = n === LESSON_STEPS.length - 1;
    await app.tweenCamera(s.camera, 1100);
    await s.enter?.(app);
  }

  app.ui.btnPrev.addEventListener('click', () => goto(app.state.step - 1));
  app.ui.btnNext.addEventListener('click', () => goto(app.state.step + 1));
  app.ui.btnPlay.addEventListener('click', () => app.setMode('game'));

  return { goto };
}
