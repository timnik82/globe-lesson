import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LOCALES, DEFAULT_LOCALE, t, setLocale } from './i18n.js';

function keyPaths(obj, prefix = '') {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' ? keyPaths(v, prefix + k + '.') : [prefix + k]
  );
}

function get(obj, path) {
  let v = obj;
  for (const part of path.split('.')) v = v?.[part];
  return v;
}

const placeholders = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);

test('у всех локалей одинаковый набор ключей', () => {
  const locales = Object.entries(LOCALES); // реестр движка, не ручной список
  assert.ok(locales.length >= 2, 'ожидаю минимум две локали');
  const baseName = DEFAULT_LOCALE;
  const baseKeys = keyPaths(LOCALES[baseName]).sort();
  assert.ok(baseKeys.length > 50, 'в словаре неожиданно мало ключей');
  for (const [name, dict] of locales) {
    if (name === baseName) continue;
    assert.deepEqual(keyPaths(dict).sort(), baseKeys, `локаль ${name} расходится с ${baseName}`);
  }
});

test('наборы плейсхолдеров совпадают между локалями', () => {
  // сравниваем на каждом ключе, даже где база без подстановок — иначе перевод
  // с лишним {n} там, где в базе его нет, пройдёт незамеченным
  const names = Object.keys(LOCALES);
  const baseName = DEFAULT_LOCALE;
  for (const path of keyPaths(LOCALES[baseName])) {
    const baseSet = placeholders(get(LOCALES[baseName], path)).sort();
    for (const name of names) {
      if (name === baseName) continue;
      const set = placeholders(get(LOCALES[name], path)).sort();
      assert.deepEqual(set, baseSet, `${path}: плейсхолдеры расходятся в ${name}`);
    }
  }
});

test('в словарях только известные имена плейсхолдеров', () => {
  const known = ['n', 'm', 'score', 'max', 'city', 'coords', 'err'];
  for (const dict of Object.values(LOCALES)) {
    for (const path of keyPaths(dict)) {
      const value = get(dict, path);
      if (typeof value !== 'string' || !value.includes('{')) continue;
      for (const name of placeholders(value)) {
        assert.ok(known.includes(name), `${path}: неожиданный плейсхолдер {${name}}`);
      }
      // после изъятия корректных {n} не должно оставаться скобок —
      // иначе в UI попадёт сырой текст вида «{ city}»
      const broken = value.replace(/\{\w+\}/g, '');
      assert.ok(!broken.includes('{') && !broken.includes('}'),
        `${path}: сломанный плейсхолдер в «${value}»`);
    }
  }
});

test('подстановка плейсхолдеров и смена локали', () => {
  setLocale('pt');
  try {
    assert.equal(t('game.round', { n: 1, m: 8, score: 5 }), 'Ronda 1 de 8 · ⭐ 5');
    assert.equal(t('lesson.progress', { n: 3, m: 10 }), 'Passo 3 de 10');
  } finally {
    setLocale(DEFAULT_LOCALE);
  }
  assert.equal(t('game.round', { n: 1, m: 8, score: 5 }), 'Раунд 1 из 8 · ⭐ 5');
  assert.equal(t('lesson.progress', { n: 3, m: 10 }), 'Шаг 3 из 10');
});
