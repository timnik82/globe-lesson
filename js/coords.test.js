import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  latLonToXYZ, xyzToLatLon, roundDeg, fmtLat, fmtLon, fmtCoords,
  angularDistanceDeg, starsForError,
} from './coords.js';

const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);

test('latLonToXYZ базовые точки', () => {
  const p0 = latLonToXYZ(0, 0); close(p0.x, 0); close(p0.y, 0); close(p0.z, 1);
  const pN = latLonToXYZ(90, 0); close(pN.x, 0); close(pN.y, 1); close(pN.z, 0);
  const pE = latLonToXYZ(0, 90); close(pE.x, 1); close(pE.y, 0); close(pE.z, 0);
  const pW = latLonToXYZ(0, -90); close(pW.x, -1); close(pW.z, 0);
});

test('xyzToLatLon туда-обратно', () => {
  for (const [la, lo] of [[55.75, 37.6], [-33.9, 151.2], [0, -74], [12, -77]]) {
    const { x, y, z } = latLonToXYZ(la, lo);
    const back = xyzToLatLon(x, y, z);
    close(back.lat, la); close(back.lon, lo);
  }
});

test('roundDeg: округление и минус-ноль', () => {
  assert.equal(roundDeg(55.4), 55); assert.equal(roundDeg(55.5), 56);
  assert.equal(roundDeg(-0.2), 0); assert.equal(Object.is(roundDeg(-0.2), -0), false);
});

test('формат широты', () => {
  assert.equal(fmtLat(55.75), '56° с.ш.');
  assert.equal(fmtLat(-22.9), '23° ю.ш.');
  assert.equal(fmtLat(0), '0°');
  assert.equal(fmtLat(90), '90° с.ш.');
});

test('формат долготы', () => {
  assert.equal(fmtLon(37.6), '38° в.д.');
  assert.equal(fmtLon(-74), '74° з.д.');
  assert.equal(fmtLon(0), '0°');
  assert.equal(fmtLon(180), '180°'); assert.equal(fmtLon(-179.9), '180°');
});

test('fmtCoords', () => {
  assert.equal(fmtCoords(55.7558, 37.6173), '56° с.ш., 38° в.д.');
});

test('угловое расстояние', () => {
  close(angularDistanceDeg(0, 0, 0, 90), 90);
  close(angularDistanceDeg(0, 0, 90, 0), 90);
  close(angularDistanceDeg(55.75, 37.6, 55.75, 37.6), 0);
  close(angularDistanceDeg(0, 0, 0, 1), 1, 1e-6);
});

test('звёзды за ошибку', () => {
  assert.equal(starsForError(4.9), 3); assert.equal(starsForError(5), 3);
  assert.equal(starsForError(5.1), 2); assert.equal(starsForError(10), 2);
  assert.equal(starsForError(10.5), 1); assert.equal(starsForError(20), 1);
  assert.equal(starsForError(21), 0);
});
