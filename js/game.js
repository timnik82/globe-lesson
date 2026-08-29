import { CITIES } from './cities.js';
import { latLonToXYZ, fmtCoords, roundDeg, angularDistanceDeg, starsForError } from './coords.js';

function shuffle(a) {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function createGame(app) {
  const { ui, grat, arcs, marker, globe } = app;
  let order = [], idx = 0, score = 0, answered = false;
  // номер поколения раунда: любой новый раунд/финал/выход из игры
  // делает старые цепочки анимаций неактуальными
  let roundId = 0;

  // зелёная точка правильного ответа
  const answerPin = new app.THREE.Mesh(
    new app.THREE.SphereGeometry(0.03, 14, 10),
    new app.THREE.MeshBasicMaterial({ color: 0x57cc99 })
  );
  answerPin.visible = false;
  app.scene.add(answerPin);

  function newRound() {
    roundId++;
    answered = false;
    const city = order[idx];
    ui.gameTask.textContent = `Найди: ${fmtCoords(city.lat, city.lon)}`;
    ui.gameProgress.textContent = `Раунд ${idx + 1} из ${order.length} · ⭐ ${score}`;
    ui.gameResult.textContent = 'Кликни по глобусу в том месте, о котором идёт речь';
    ui.gameNext.hidden = true;
    ui.gameFinal.hidden = true;
    answerPin.visible = false;
    grat.setLayers({ equator: true, greenwich: true });
    grat.setPointHighlight(null);
    globe.setGlass(false);
    arcs.lat.hide();
    arcs.lon.hide();
    marker.hide();
  }

  async function handleAnswer(lat, lon) {
    if (answered) return;
    answered = true;
    const my = roundId;
    const city = order[idx];
    const err = angularDistanceDeg(lat, lon, city.lat, city.lon);
    const stars = starsForError(err);
    score += stars;
    marker.setLatLon(lat, lon);
    marker.show();
    const pos = latLonToXYZ(city.lat, city.lon, 1.02);
    answerPin.position.set(pos.x, pos.y, pos.z);
    answerPin.visible = true;
    ui.gameResult.innerHTML =
      `Это <b>${city.name}</b>! Ошибка: ${roundDeg(err)}°<br>` +
      '⭐'.repeat(stars) + '✩'.repeat(3 - stars);
    ui.gameProgress.textContent = `Раунд ${idx + 1} из ${order.length} · ⭐ ${score}`;
    globe.setGlass(true);
    // повернуть глобус к городу, чтобы ребёнок увидел, где он находится
    const camPos = latLonToXYZ(22, city.lon, 3.2);
    await app.tweenCamera({ pos: [camPos.x, camPos.y, camPos.z], target: [0, 0, 0] }, 800);
    if (my !== roundId) return;
    await arcs.lat.grow(city.lat, city.lon, 900);
    if (my !== roundId) return;
    await arcs.lon.grow(city.lon, 900);
    if (my !== roundId) return;
    ui.gameNext.hidden = false;
  }

  function next() {
    idx++;
    if (idx < order.length) newRound();
    else {
      roundId++; // убить анимации последнего ответа
      ui.gameTask.textContent = 'Игра пройдена!';
      ui.gameResult.textContent = '';
      ui.gameProgress.textContent = '';
      ui.gameNext.hidden = true;
      ui.gameScore.textContent = `Твои звёзды: ${score} из ${order.length * 3}`;
      ui.gameFinal.hidden = false;
      marker.hide();
      answerPin.visible = false;
      arcs.lat.hide();
      arcs.lon.hide();
      globe.setGlass(false);
    }
  }

  ui.gameNext.addEventListener('click', next);
  ui.gameRestart.addEventListener('click', () => enter());

  function enter() {
    order = shuffle(CITIES).slice(0, 8);
    idx = 0;
    score = 0;
    newRound();
  }

  return {
    enter,
    handleAnswer,
    invalidate: () => { roundId++; },
  };
}
