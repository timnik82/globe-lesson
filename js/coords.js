import { t } from './i18n.js';

export const DEG = Math.PI / 180;
export const RAD = 180 / Math.PI;

export function latLonToXYZ(lat, lon, r = 1) {
  const la = lat * DEG, lo = lon * DEG;
  return {
    x: r * Math.cos(la) * Math.sin(lo),
    y: r * Math.sin(la),
    z: r * Math.cos(la) * Math.cos(lo),
  };
}

export function xyzToLatLon(x, y, z) {
  const r = Math.hypot(x, y, z) || 1;
  const lat = Math.asin(Math.max(-1, Math.min(1, y / r))) * RAD;
  let lon = Math.atan2(x, z) * RAD;
  if (lon <= -180) lon = 180;
  return { lat, lon };
}

export function roundDeg(v) {
  const r = Math.round(v);
  return Object.is(r, -0) ? 0 : r;
}

export function fmtLat(lat) {
  const d = roundDeg(lat);
  if (d === 0) return '0°';
  return d > 0 ? `${d}° ${t('coords.latN')}` : `${-d}° ${t('coords.latS')}`;
}

export function fmtLon(lon) {
  const d = roundDeg(lon);
  if (d === 0 || Math.abs(d) === 180) return `${Math.abs(d)}°`;
  return d > 0 ? `${d}° ${t('coords.lonE')}` : `${-d}° ${t('coords.lonW')}`;
}

export function fmtCoords(lat, lon) {
  return `${fmtLat(lat)}, ${fmtLon(lon)}`;
}

export function angularDistanceDeg(lat1, lon1, lat2, lon2) {
  const f1 = lat1 * DEG, f2 = lat2 * DEG, dl = (lon2 - lon1) * DEG;
  const c = Math.sin(f1) * Math.sin(f2) + Math.cos(f1) * Math.cos(f2) * Math.cos(dl);
  return Math.acos(Math.max(-1, Math.min(1, c))) * RAD;
}

export function starsForError(d) {
  if (d <= 5) return 3;
  if (d <= 10) return 2;
  if (d <= 20) return 1;
  return 0;
}
