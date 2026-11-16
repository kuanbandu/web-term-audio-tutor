import { DEFAULT_BASE_URL, DEFAULT_MODEL } from './extractTerms.js';

const SETTINGS_KEY = 'wta.settings.v1';
const NOTEBOOK_KEY = 'wta.notebook.v1';
const SESSION_KEY = 'wta.last-session.v1';

export const DEFAULT_SETTINGS = {
  baseUrl: DEFAULT_BASE_URL,
  apiKey: '',
  model: DEFAULT_MODEL,
  rate: 0.95,
  voiceURI: '',
  quizDelay: 1500,
  mode: 'card',
  loop: false,
};

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function clamp(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

export function loadSettings() {
  const saved = readJSON(SETTINGS_KEY, {});
  const merged = { ...DEFAULT_SETTINGS, ...(saved && typeof saved === 'object' ? saved : {}) };
  return {
    baseUrl: String(merged.baseUrl || DEFAULT_BASE_URL),
    apiKey: String(merged.apiKey || ''),
    model: String(merged.model || DEFAULT_MODEL),
    rate: clamp(merged.rate, 0.6, 1.4, DEFAULT_SETTINGS.rate),
    voiceURI: String(merged.voiceURI || ''),
    quizDelay: [1000, 1500, 2000, 3000].includes(Number(merged.quizDelay))
      ? Number(merged.quizDelay)
      : DEFAULT_SETTINGS.quizDelay,
    mode: merged.mode === 'quiz' ? 'quiz' : 'card',
    loop: Boolean(merged.loop),
  };
}

export function saveSettings(settings) {
  return writeJSON(SETTINGS_KEY, settings);
}

function normalizeNotebookItem(item) {
  if (!item || typeof item !== 'object') return null;
  const term = String(item.term || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!term) return null;
  return {
    id: String(item.id || term.toLowerCase()),
    term,
    zh: String(item.zh || '').trim(),
    example: String(item.example || '').trim(),
    tag: String(item.tag || '术语').trim(),
    addedAt: Number(item.addedAt) || Date.now(),
  };
}

export function loadNotebook() {
  const saved = readJSON(NOTEBOOK_KEY, []);
  if (!Array.isArray(saved)) return [];
  return saved.map(normalizeNotebookItem).filter(Boolean).slice(0, 500);
}

export function saveNotebook(items) {
  return writeJSON(NOTEBOOK_KEY, items);
}

export function addToNotebook(card) {
  const notebook = loadNotebook();
  const key = String(card?.term || '').toLowerCase();
  if (!key) return notebook;
  if (notebook.some((item) => item.term.toLowerCase() === key)) return notebook;

  const item = normalizeNotebookItem({ ...card, addedAt: Date.now() });
  const next = item ? [item, ...notebook].slice(0, 500) : notebook;
  saveNotebook(next);
  return next;
}

export function removeFromNotebook(term) {
  const key = String(term || '').toLowerCase();
  const next = loadNotebook().filter((item) => item.term.toLowerCase() !== key);
  saveNotebook(next);
  return next;
}

export function saveSession(session) {
  return writeJSON(SESSION_KEY, {
    cards: Array.isArray(session?.cards) ? session.cards : [],
    sourceTitle: String(session?.sourceTitle || ''),
    sourceUrl: String(session?.sourceUrl || ''),
    savedAt: Date.now(),
  });
}

export function loadSession() {
  const saved = readJSON(SESSION_KEY, null);
  if (!saved || !Array.isArray(saved.cards)) return null;
  return saved;
}

export function clearAllData() {
  for (const key of [SETTINGS_KEY, NOTEBOOK_KEY, SESSION_KEY]) {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
}
