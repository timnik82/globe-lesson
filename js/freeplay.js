import { fmtLat, fmtLon } from './coords.js';
import { EXAMPLES } from './cities.js';

export function createFreeplay(app) {
  const {
    ui: {
      latSlider, lonSlider, latVal, lonVal, coordsReadout,
      layParallels, layMeridians, layEquator, layGreenwich, layArcs, layCities,
    }, grat, arcs, marker, citiesLayer, globe, state,
  } = app;

  function applyLayers() {
    grat.setLayers({
      parallels: layParallels.checked, meridians: layMeridians.checked,
      equator: layEquator.checked, greenwich: layGreenwich.checked,
    });
    grat.setMeridian180(false);
    grat.setPointHighlight(null);
    citiesLayer.visible = layCities.checked;
    globe.setGlass(layArcs.checked);
    if (layArcs.checked) { arcs.lat.set(state.lat, state.lon); arcs.lon.set(state.lon); }
    else { arcs.lat.hide(); arcs.lon.hide(); }
  }

  function update(lat, lon, fromSlider = false) {
    state.lat = lat; state.lon = lon;
    marker.setLatLon(lat, lon);
    if (layArcs.checked) { arcs.lat.set(lat, lon); arcs.lon.set(lon); }
    coordsReadout.textContent = `${fmtLat(lat)}, ${fmtLon(lon)}`;
    latVal.textContent = fmtLat(lat);
    lonVal.textContent = fmtLon(lon);
    if (!fromSlider) {
      latSlider.value = Math.round(lat);
      lonSlider.value = Math.round(lon);
    }
  }

  // перетаскивание и слайдеры шлют события чаще, чем кадры; собираем в один update на кадр
  let pendingUpdate = null;
  let updateRaf = 0;
  function scheduleUpdate(lat, lon, fromSlider = false) {
    pendingUpdate = [lat, lon, fromSlider];
    if (!updateRaf) {
      updateRaf = requestAnimationFrame(() => {
        updateRaf = 0;
        if (pendingUpdate) {
          const [la, lo, fs] = pendingUpdate;
          pendingUpdate = null;
          update(la, lo, fs);
        }
      });
    }
  }

  latSlider.addEventListener('input', () => scheduleUpdate(+latSlider.value, state.lon, true));
  lonSlider.addEventListener('input', () => scheduleUpdate(state.lat, +lonSlider.value, true));
  for (const box of [layParallels, layMeridians, layEquator, layGreenwich, layArcs, layCities]) {
    box.addEventListener('change', applyLayers);
  }

  for (const btn of document.querySelectorAll('#examples button')) {
    btn.addEventListener('click', () => {
      const ex = EXAMPLES[btn.dataset.city];
      app.flyMarker(ex.lat, ex.lon);
    });
  }

  return {
    enter() {
      marker.show();
      applyLayers();
      update(state.lat, state.lon);
    },
    leave() {},
    update,
    schedule: scheduleUpdate,
  };
}
