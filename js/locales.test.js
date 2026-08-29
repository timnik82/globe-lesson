import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ru } from './locales/ru.js';
import { pt } from './locales/pt.js';
import { t, setLocale, DEFAULT_LOCALE } from './i18n.js';

function keyPaths(obj, prefix = '') {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' ? keyPaths(v, prefix + k + '.') : [prefix + k]
  );
}

test('у всех локалей одинаковый набор ключей', () => {
  const ruKeys = keyPaths(ru).sort();
  assert.ok(ruKeys.length > 50, 'в словаре неожиданно мало ключей');
  for (const [name, dict] of Object.entries({ pt })) {
    assert.deepEqual(keyPaths(dict).sort(), ruKeys, `локаль ${name} расходится с ru`);
  }
});

test('подстановка плейсхолдеров и смена локали', () => {
  setLocale('pt');
  assert.equal(t('game.round', { n: 1, m: 8, score: 5 }), 'Ronda 1 de 8 · ⭐ 5');
  assert.equal(t('lesson.progress', { n: 3, m: 10 }), 'Passo 3 de 10');
  setLocale('ru');
  assert.equal(t('game.round', { n: 1, m: 8, score: 5 }), 'Раунд 1 из 8 · ⭐ 5');
  assert.equal(t('lesson.progress', { n: 3, m: 10 }), 'Шаг 3 из 10');
  setLocale(DEFAULT_LOCALE);
});

test('нетронутые плейсхолдеры не остаются в переводах', () => {
  for (const dict of [ru, pt]) {
    for (const path of keyPaths(dict)) {
      let v = dict;
      for (const part of path.split('.')) v = v[part];
      if (typeof v !== 'string' || !v.includes('{')) continue;
      // все {n}-подстановки — из фиксированного набора имён
      const names = [...v.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
      for (const n of names) {
        assert.ok(['n', 'm', 'score', 'max', 'city', 'coords', 'err'].includes(n),
          `${path}: неожиданный плейсхолдер {${n}}`);
      }
    }
  }
});
