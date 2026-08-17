// Готовит data/continents.json — кольца [lon,lat] всей суши, координаты до 2 знаков.
import { writeFile } from 'node:fs/promises';

const URLS = [
  'https://raw.githubusercontent.com/martynafford/natural-earth-geojson/master/110m/physical/ne_110m_land.json',
  'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_land.geojson',
];

async function main() {
  let geo = null;
  for (const u of URLS) {
    try {
      const r = await fetch(u);
      if (!r.ok) throw new Error(r.status);
      const j = await r.json();
      if (j.type === 'Topology') throw new Error('topojson не поддерживается этим скриптом');
      geo = j; break;
    } catch (e) { console.error('не получилось:', u, e.message); }
  }
  if (!geo) {
    console.error('Оба URL не сработали. Запасной путь: npm i world-atlas topojson-client в tools/ и конвертация feature(land-110m).');
    process.exit(1);
  }
  const rings = [];
  const pushRing = (ring) => {
    rings.push(ring.map(([lon, lat]) => [
      Math.round(lon * 100) / 100, Math.round(lat * 100) / 100,
    ]));
  };
  const features = geo.type === 'FeatureCollection' ? geo.features : [geo];
  for (const f of features) {
    const g = f.type === 'Feature' ? f.geometry : f;
    if (!g) continue;
    if (g.type === 'Polygon') g.coordinates.forEach(pushRing);
    else if (g.type === 'MultiPolygon') g.coordinates.forEach((poly) => poly.forEach(pushRing));
  }
  await writeFile('data/continents.json', JSON.stringify({ rings }));
  console.log('ок:', rings.length, 'колец');
}
main();
