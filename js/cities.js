import { t } from './i18n.js';

export const CITIES = [
  { id: 'moscow', lat: 55.7558, lon: 37.6173 },
  { id: 'spb', lat: 59.9311, lon: 30.3609 },
  { id: 'london', lat: 51.5074, lon: -0.1278 },
  { id: 'cairo', lat: 30.0444, lon: 31.2357 },
  { id: 'newyork', lat: 40.7128, lon: -74.0060 },
  { id: 'rio', lat: -22.9068, lon: -43.1729 },
  { id: 'sydney', lat: -33.8688, lon: 151.2093 },
  { id: 'tokyo', lat: 35.6762, lon: 139.6503 },
  { id: 'beijing', lat: 39.9042, lon: 116.4074 },
  { id: 'delhi', lat: 28.6139, lon: 77.2090 },
  { id: 'capetown', lat: -33.9249, lon: 18.4241 },
  { id: 'lima', lat: -12.0464, lon: -77.0428 },
  { id: 'honolulu', lat: 21.3069, lon: -157.8583 },
];

// отображаемое имя города — из словаря текущего языка
export const cityName = (c) => t(`cities.${c.id}`);

export const EXAMPLES = {
  moscow: CITIES[0],
  greenwich: { lat: 51.4779, lon: 0 },
  'north-pole': { lat: 90, lon: 0 },
};
