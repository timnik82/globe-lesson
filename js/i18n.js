import { ru } from './locales/ru.js';
import { pt } from './locales/pt.js';

const LOCALES = { ru, pt };
export const DEFAULT_LOCALE = 'ru';

let current = DEFAULT_LOCALE;
const listeners = new Set();

export function getLocale() { return current; }

export function setLocale(loc) {
  if (!LOCALES[loc] || loc === current) return;
  current = loc;
  if (typeof document !== 'undefined') {
    document.documentElement.lang = loc;
    applyStatic();
  }
  for (const fn of listeners) fn(loc);
}

export function onChange(fn) { listeners.add(fn); }

function lookup(loc, key) {
  let v = LOCALES[loc];
  for (const part of key.split('.')) v = v?.[part];
  return v;
}

// t('game.round', { n: 2, m: 8, score: 5 }) -> подстановка {n}-плейсхолдеров;
// если ключа в текущей локали нет — падаем на ru, чтобы страница не осталась без текста
export function t(key, params) {
  let v = lookup(current, key) ?? lookup(DEFAULT_LOCALE, key);
  if (v == null) return key;
  if (params) {
    for (const [name, val] of Object.entries(params)) {
      v = v.replaceAll(`{${name}}`, String(val));
    }
  }
  return v;
}

// статические тексты разметки: <el data-i18n="ключ"> и <el data-i18n-title="ключ">
export function applyStatic(root = document) {
  for (const el of root.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  for (const el of root.querySelectorAll('[data-i18n-title]')) el.title = t(el.dataset.i18nTitle);
}
