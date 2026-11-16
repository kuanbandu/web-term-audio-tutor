import {
  DEFAULT_MODEL,
  extractTerms,
  normalizeBaseUrl,
  testLLM,
} from './extractTerms.js';
import { fetchArticle } from './fetchArticle.js';
import { cardsToAnkiCSV, cardsToJSON, downloadFile, fileStamp } from './exporters.js';
import {
  addToNotebook,
  clearAllData,
  loadNotebook,
  loadSession,
  loadSettings,
  removeFromNotebook,
  saveNotebook,
  saveSession,
  saveSettings,
} from './store.js';
import {
  beginPlayback,
  englishVoices,
  isStale,
  onVoicesChanged,
  pickChineseVoice,
  pickEnglishVoice,
  speak,
  speechSupported,
  stopSpeaking,
  wait,
} from './speak.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const el = {
  sourceLine: $('#sourceLine'),
  views: {
    learn: $('#view-learn'),
    notebook: $('#view-notebook'),
    settings: $('#view-settings'),
  },
  tabs: $$('.tab'),
  btnSettings: $('#btnSettings'),

  urlInput: $('#urlInput'),
  btnFetch: $('#btnFetch'),
  pasteBox: $('#pasteBox'),
  textInput: $('#textInput'),
  btnExtract: $('#btnExtract'),
  status: $('#status'),
  modeHint: $('#modeHint'),

  player: $('#player'),
  progress: $('#progress'),
  playState: $('#playState'),
  btnPlay: $('#btnPlay'),
  btnStop: $('#btnStop'),
  segBtns: $$('.seg-btn'),
  loopToggle: $('#loopToggle'),
  playRate: $('#playRate'),
  playRateValue: $('#playRateValue'),

  cardsWrap: $('#cardsWrap'),
  emptyHint: $('#emptyHint'),
  resultActions: $('#resultActions'),
  btnExportJson: $('#btnExportJson'),
  btnExportCsv: $('#btnExportCsv'),

  nbCount: $('#nbCount'),
  btnNbPlay: $('#btnNbPlay'),
  btnNbStop: $('#btnNbStop'),
  nbList: $('#nbList'),
  nbEmpty: $('#nbEmpty'),
  btnExportNbJson: $('#btnExportNbJson'),
  btnExportNbCsv: $('#btnExportNbCsv'),
  btnClearNb: $('#btnClearNb'),

  baseUrl: $('#baseUrl'),
  apiKey: $('#apiKey'),
  btnToggleKey: $('#btnToggleKey'),
  model: $('#model'),
  btnSaveSettings: $('#btnSaveSettings'),
  btnTest: $('#btnTest'),
  settingsStatus: $('#settingsStatus'),

  voiceSelect: $('#voiceSelect'),
  rateSetting: $('#rateSetting'),
  rateValue: $('#rateValue'),
  quizDelay: $('#quizDelay'),
  btnRefreshVoices: $('#btnRefreshVoices'),
  btnClearData: $('#btnClearData'),

  toast: $('#toast'),
};

const state = {
  settings: loadSettings(),
  cards: [],
  notebook: loadNotebook(),
  sourceTitle: '',
  sourceUrl: '',
  lastFetchedUrl: '',
  lastFetchedText: '',
  playing: false,
  singlePlaying: false,
  nbPlaying: false,
  busy: false,
  voiceCleanup: null,
};

let toastTimer = null;

/* ------------------------------------------------------------------ */
/* 通用 UI                                                             */
/* ------------------------------------------------------------------ */

function toast(message) {
  if (!el.toast) return;
  el.toast.textContent = message;
  el.toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.toast.classList.remove('show'), 2200);
}

function setStatus(message, type = '') {
  el.status.textContent = message || '';
  if (type) el.status.dataset.type = type;
  else el.status.removeAttribute('data-type');
}

function setSettingsStatus(message, type = '') {
  el.settingsStatus.textContent = message || '';
  if (type) el.settingsStatus.dataset.type = type;
  else el.settingsStatus.removeAttribute('data-type');
}

function setSourceTitle(title) {
  state.sourceTitle = String(title || '').trim();
  el.sourceLine.textContent = state.sourceTitle || '输入网页，生成可听的术语卡';
  el.sourceLine.title = state.sourceTitle;
}

function formatRate(rate) {
  return `${Number(rate).toFixed(2)}×`;
}

function switchView(name) {
  const target = el.views[name] ? name : 'learn';
  for (const [key, view] of Object.entries(el.views)) {
    view.classList.toggle('hidden', key !== target);
  }
  for (const tab of el.tabs) {
    const active = tab.dataset.view === target;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-current', active ? 'page' : 'false');
  }
  if (target === 'settings') {
    refreshVoiceOptions();
  }
  if (target === 'notebook') {
    renderNotebook();
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setBusy(busy, action = '') {
  state.busy = busy;
  el.btnFetch.disabled = busy;
  el.btnExtract.disabled = busy;
  el.btnFetch.textContent = busy && action === 'fetch' ? '抓取中…' : '抓取';
  el.btnExtract.textContent = busy && action === 'extract' ? '提取中…' : '提取术语并生成卡片';
}

function refreshModeHint() {
  if (!state.settings.apiKey) {
    el.modeHint.textContent = '未配置 API Key：使用内置词表粗略提取，能立刻出声；到设置页填 Key 可提升释义质量。';
  } else {
    el.modeHint.textContent = `已配置 LLM（${state.settings.model || DEFAULT_MODEL}）：提取质量更好。`;
  }
}

/* ------------------------------------------------------------------ */
/* 术语卡                                                              */
/* ------------------------------------------------------------------ */

function isSaved(term) {
  const key = String(term || '').toLowerCase();
  return state.notebook.some((item) => item.term.toLowerCase() === key);
}

function normalizeCard(card, index) {
  const term = String(card?.term || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!term) return null;
  return {
    id: String(card?.id || `t${index + 1}`),
    term,
    zh: String(card?.zh || '').trim(),
    example: String(card?.example || '').trim(),
    tag: String(card?.tag || '术语').trim(),
  };
}

function createCardEl(card, index, container) {
  const article = document.createElement('article');
  article.className = 'term-card';
  article.dataset.idx = String(index);
  article.tabIndex = 0;
  article.setAttribute('role', 'button');
  article.setAttribute('aria-label', `朗读 ${card.term}`);

  const head = document.createElement('div');
  head.className = 'term-head';

  const title = document.createElement('h3');
  title.textContent = card.term;
  head.appendChild(title);

  if (card.tag) {
    const tag = document.createElement('span');
    tag.className = 'chip tag';
    tag.textContent = card.tag;
    head.appendChild(tag);
  }

  const actions = document.createElement('div');
  actions.className = 'card-actions';

  const saved = isSaved(card.term);
  const star = document.createElement('button');
  star.type = 'button';
  star.className = 'icon-btn';
  star.dataset.action = 'star';
  star.textContent = saved ? '★' : '☆';
  star.classList.toggle('saved', saved);
  star.setAttribute('aria-label', saved ? '移出生词本' : '加入生词本');
  star.addEventListener('click', (event) => {
    event.stopPropagation();
    toggleSave(card);
  });

  const speaker = document.createElement('button');
  speaker.type = 'button';
  speaker.className = 'icon-btn';
  speaker.dataset.action = 'speak';
  speaker.textContent = '🔊';
  speaker.setAttribute('aria-label', '朗读此术语');
  speaker.addEventListener('click', (event) => {
    event.stopPropagation();
    speakCard(card, index, container);
  });

  actions.append(star, speaker);

  const body = document.createElement('div');
  if (card.zh) {
    const zh = document.createElement('p');
    zh.className = 'zh';
    zh.textContent = card.zh;
    body.appendChild(zh);
  }
  if (card.example) {
    const example = document.createElement('p');
    example.className = 'example';
    example.textContent = `“${card.example}”`;
    body.appendChild(example);
  }

  article.append(head, actions, body);
  article.addEventListener('click', () => speakCard(card, index, container));
  article.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      speakCard(card, index, container);
    }
  });

  return article;
}

function refreshStars() {
  for (const cardEl of $$('.term-card')) {
    const term = cardEl.querySelector('h3')?.textContent || '';
    const star = cardEl.querySelector('[data-action="star"]');
    if (!star) continue;
    const saved = isSaved(term);
    star.textContent = saved ? '★' : '☆';
    star.classList.toggle('saved', saved);
    star.setAttribute('aria-label', saved ? '移出生词本' : '加入生词本');
  }
}

function toggleSave(card) {
  const saved = isSaved(card.term);
  state.notebook = saved ? removeFromNotebook(card.term) : addToNotebook(card);
  toast(saved ? '已移出生词本' : '已加入生词本');
  el.nbCount.textContent = String(state.notebook.length);
  refreshStars();
  if (!el.views.notebook.classList.contains('hidden')) {
    renderNotebook();
  }
  updateNotebookUI();
}

function renderCards() {
  el.cardsWrap.textContent = '';
  state.cards.forEach((card, index) => {
    el.cardsWrap.appendChild(createCardEl(card, index, el.cardsWrap));
  });

  const hasCards = state.cards.length > 0;
  el.emptyHint.classList.toggle('hidden', hasCards);
  el.resultActions.classList.toggle('hidden', !hasCards);
  el.player.classList.toggle('hidden', !hasCards);
  if (hasCards) {
    setSourceTitle(state.sourceTitle);
  }
}

function renderNotebook() {
  el.nbList.textContent = '';
  state.notebook = loadNotebook();
  el.nbCount.textContent = String(state.notebook.length);

  state.notebook.forEach((card, index) => {
    el.nbList.appendChild(createCardEl(card, index, el.nbList));
  });

  el.nbEmpty.classList.toggle('hidden', state.notebook.length > 0);
  updateNotebookUI();
}

function markSpeaking(container, index) {
  clearSpeaking(container);
  const target = container.querySelector(`[data-idx="${index}"]`);
  if (!target) return;
  target.classList.add('speaking');
  target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function clearSpeaking(container) {
  for (const item of $$('.term-card.speaking', container)) {
    item.classList.remove('speaking');
  }
}

/* ------------------------------------------------------------------ */
/* 播放                                                                */
/* ------------------------------------------------------------------ */

function updatePlayerUI() {
  const supported = speechSupported();
  el.btnPlay.disabled = state.playing || state.singlePlaying || !state.cards.length || !supported;
  el.btnStop.disabled = !state.playing && !state.singlePlaying;
  el.btnPlay.textContent = state.playing ? '▶ 播放中' : '▶ 朗读';
}

function updateNotebookUI() {
  const supported = speechSupported();
  const hasItems = state.notebook.length > 0;
  el.btnNbPlay.disabled = !hasItems || state.nbPlaying || !supported;
  el.btnNbStop.disabled = !state.nbPlaying;
  el.btnExportNbJson.disabled = !hasItems;
  el.btnExportNbCsv.disabled = !hasItems;
  el.btnClearNb.disabled = !hasItems;
}

function updateModeUI() {
  for (const button of el.segBtns) {
    const active = button.dataset.mode === state.settings.mode;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  }
}

async function playCards(cards, session, { mode, allowLoop, container, onIndex }) {
  do {
    for (let index = 0; index < cards.length; index += 1) {
      if (isStale(session)) return;
      const card = cards[index];
      const rate = state.settings.rate;
      const enOptions = {
        lang: 'en-US',
        rate,
        voice: pickEnglishVoice(state.settings.voiceURI),
      };
      const zhOptions = { lang: 'zh-CN', rate, voice: pickChineseVoice() };

      onIndex?.(index);
      markSpeaking(container, index);

      await speak(card.term, enOptions);
      if (isStale(session)) return;

      if (mode === 'quiz') {
        if (!(await wait(state.settings.quizDelay, session))) return;
        if (card.zh) {
          await speak(card.zh, zhOptions);
          if (isStale(session)) return;
        }
      } else {
        if (card.zh) {
          await speak(card.zh, zhOptions);
          if (isStale(session)) return;
        }
        if (card.example) {
          await speak(card.example, enOptions);
          if (isStale(session)) return;
        }
      }
    }
    if (!allowLoop || !state.settings.loop) break;
    if (!(await wait(900, session))) return;
  } while (!isStale(session));
}

async function startLearnPlay() {
  if (!speechSupported()) {
    toast('当前浏览器不支持语音合成');
    return;
  }
  if (!state.cards.length) return;

  const session = beginPlayback();
  state.playing = true;
  state.singlePlaying = false;
  state.nbPlaying = false;
  updatePlayerUI();
  updateNotebookUI();
  el.playState.textContent = state.settings.loop ? '循环朗读中' : '朗读中';
  el.progress.textContent = `0 / ${state.cards.length}`;

  await playCards(state.cards, session, {
    mode: state.settings.mode,
    allowLoop: true,
    container: el.cardsWrap,
    onIndex: (index) => {
      el.progress.textContent = `${index + 1} / ${state.cards.length}`;
    },
  });

  if (isStale(session)) return;
  state.playing = false;
  clearSpeaking(el.cardsWrap);
  el.playState.textContent = '';
  el.progress.textContent = `${state.cards.length} / ${state.cards.length}`;
  updatePlayerUI();
}

async function startNotebookPlay() {
  if (!speechSupported()) {
    toast('当前浏览器不支持语音合成');
    return;
  }
  if (!state.notebook.length) return;

  const session = beginPlayback();
  state.nbPlaying = true;
  state.playing = false;
  state.singlePlaying = false;
  updateNotebookUI();
  updatePlayerUI();
  el.playState.textContent = '生词本朗读中';

  await playCards(state.notebook, session, {
    mode: 'card',
    allowLoop: false,
    container: el.nbList,
  });

  if (isStale(session)) return;
  state.nbPlaying = false;
  clearSpeaking(el.nbList);
  el.playState.textContent = '';
  updateNotebookUI();
}

async function speakCard(card, index, container) {
  if (!speechSupported()) {
    toast('当前浏览器不支持语音合成');
    return;
  }
  const session = beginPlayback();
  state.playing = false;
  state.singlePlaying = true;
  state.nbPlaying = false;
  updatePlayerUI();
  updateNotebookUI();
  el.playState.textContent = '单卡朗读';
  markSpeaking(container, index);

  await speak(card.term, {
    lang: 'en-US',
    rate: state.settings.rate,
    voice: pickEnglishVoice(state.settings.voiceURI),
  });
  if (isStale(session)) return;
  if (card.zh) {
    await speak(card.zh, { lang: 'zh-CN', rate: state.settings.rate, voice: pickChineseVoice() });
    if (isStale(session)) return;
  }
  state.singlePlaying = false;
  clearSpeaking(container);
  el.playState.textContent = '';
  updatePlayerUI();
}

function stopAll() {
  stopSpeaking();
  state.playing = false;
  state.singlePlaying = false;
  state.nbPlaying = false;
  clearSpeaking(el.cardsWrap);
  clearSpeaking(el.nbList);
  el.playState.textContent = '';
  if (state.cards.length) {
    el.progress.textContent = `${state.cards.length} / ${state.cards.length}`;
  }
  updatePlayerUI();
  updateNotebookUI();
}

/* ------------------------------------------------------------------ */
/* 抓取与提取                                                          */
/* ------------------------------------------------------------------ */

async function onFetch() {
  if (state.busy) return;
  const raw = el.urlInput.value.trim();
  if (!raw) {
    setStatus('请输入网页地址，或展开下方手动粘贴正文。', 'error');
    el.pasteBox.open = true;
    return;
  }

  setBusy(true, 'fetch');
  setStatus('正在通过 r.jina.ai 抓取正文…');
  try {
    const article = await fetchArticle(raw);
    el.urlInput.value = article.url;
    el.textInput.value = article.text;
    el.pasteBox.open = true;
    state.sourceUrl = article.url;
    state.lastFetchedUrl = article.url;
    state.lastFetchedText = article.text;
    setSourceTitle(article.title);
    setStatus(`已抓取「${article.title}」（${article.text.length} 字）。检查正文后点“提取术语”。`, 'ok');
  } catch (error) {
    setStatus(`抓取失败：${error.message}`, 'error');
    el.pasteBox.open = true;
  } finally {
    setBusy(false);
  }
}

async function onExtract() {
  if (state.busy) return;

  let text = el.textInput.value.trim();
  const rawUrl = el.urlInput.value.trim();
  if (text.length < 40 && !rawUrl) {
    setStatus('请先抓取网页，或粘贴至少几十字的正文。', 'error');
    el.pasteBox.open = true;
    return;
  }

  setBusy(true, 'extract');
  try {
    if (text.length < 40) {
      setStatus('正在抓取正文…');
      const article = await fetchArticle(rawUrl);
      text = article.text;
      el.textInput.value = text;
      el.urlInput.value = article.url;
      el.pasteBox.open = true;
      state.sourceUrl = article.url;
      state.lastFetchedUrl = article.url;
      state.lastFetchedText = article.text;
      setSourceTitle(article.title);
    } else if (!rawUrl) {
      setSourceTitle('粘贴的正文');
    } else if (!state.sourceTitle) {
      setSourceTitle(safeHostname(rawUrl));
    }

    setStatus('正在提取术语，请稍候…');
    const result = await extractTerms(text, state.settings, {
      onProgress: (message) => setStatus(message),
    });

    if (!result.cards.length) {
      setStatus('没有提取到术语。换一个页面，或粘贴更完整的正文再试。', 'warn');
      return;
    }

    state.cards = result.cards;
    if (!state.sourceTitle) {
      setSourceTitle(rawUrl ? safeHostname(rawUrl) : '粘贴的正文');
    }
    renderCards();
    el.progress.textContent = `${state.cards.length} / ${state.cards.length}`;
    saveSession({
      cards: state.cards,
      sourceTitle: state.sourceTitle,
      sourceUrl: state.sourceUrl || rawUrl,
    });

    const summary =
      result.mode === 'llm'
        ? `LLM 已提取 ${result.cards.length} 个术语，点“朗读”开始。`
        : `未配置 API Key，已用内置词表提取 ${result.cards.length} 个术语。`;
    setStatus(result.warning || summary, result.warning ? 'warn' : 'ok');
    el.player.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) {
    setStatus(`处理失败：${error.message}`, 'error');
    if (!el.textInput.value.trim()) el.pasteBox.open = true;
  } finally {
    setBusy(false);
  }
}

function safeHostname(raw) {
  const value = String(raw || '').trim();
  if (!value) return '粘贴的正文';
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    return url.hostname || '粘贴的正文';
  } catch {
    return '粘贴的正文';
  }
}

/* ------------------------------------------------------------------ */
/* 设置                                                                */
/* ------------------------------------------------------------------ */

function applyRateUI(rate) {
  const value = String(rate);
  el.rateSetting.value = value;
  el.playRate.value = value;
  el.rateValue.textContent = formatRate(rate);
  el.playRateValue.textContent = formatRate(rate);
}

function applySettingsToForm() {
  const settings = state.settings;
  el.baseUrl.value = settings.baseUrl;
  el.apiKey.value = settings.apiKey;
  el.model.value = settings.model;
  el.quizDelay.value = String(settings.quizDelay);
  el.loopToggle.checked = settings.loop;
  applyRateUI(settings.rate);
  updateModeUI();
  refreshModeHint();
  refreshVoiceOptions();
}

function readSettingsForm() {
  return {
    ...state.settings,
    baseUrl: normalizeBaseUrl(el.baseUrl.value),
    apiKey: el.apiKey.value.trim(),
    model: el.model.value.trim() || DEFAULT_MODEL,
    rate: Number(el.rateSetting.value) || state.settings.rate,
    voiceURI: el.voiceSelect.value,
    quizDelay: Number(el.quizDelay.value) || state.settings.quizDelay,
  };
}

function onSaveSettings() {
  state.settings = readSettingsForm();
  const ok = saveSettings(state.settings);
  applySettingsToForm();
  if (ok) {
    setSettingsStatus('已保存。可以回学习页提取术语了。', 'ok');
    toast('设置已保存');
  } else {
    setSettingsStatus('保存失败：浏览器存储不可用（无痕模式？）。', 'error');
  }
}

async function onTestConnection() {
  const settings = readSettingsForm();
  if (!settings.apiKey) {
    setSettingsStatus('请先填写 API Key。', 'error');
    return;
  }

  el.btnTest.disabled = true;
  el.btnTest.textContent = '测试中…';
  setSettingsStatus('正在连接 LLM 接口…');
  try {
    await testLLM(settings);
    setSettingsStatus('连接成功 ✓ 可以回学习页提取术语了。', 'ok');
  } catch (error) {
    setSettingsStatus(error.message, 'error');
  } finally {
    el.btnTest.disabled = false;
    el.btnTest.textContent = '测试连接';
  }
}

function onRateChange(raw) {
  const rate = Math.min(1.4, Math.max(0.6, Number(raw) || 0.95));
  state.settings.rate = rate;
  applyRateUI(rate);
  saveSettings(state.settings);
}

function refreshVoiceOptions() {
  if (!el.voiceSelect) return;
  const current = el.voiceSelect.value || state.settings.voiceURI;
  const voices = englishVoices();

  el.voiceSelect.textContent = '';
  el.voiceSelect.add(new Option('自动（推荐）', ''));
  for (const voice of voices) {
    el.voiceSelect.add(new Option(`${voice.name} · ${voice.lang}`, voice.voiceURI));
  }

  const wanted = voices.some((voice) => voice.voiceURI === current)
    ? current
    : state.settings.voiceURI;
  el.voiceSelect.value = voices.some((voice) => voice.voiceURI === wanted) ? wanted : '';
}

function setupVoices() {
  if (!speechSupported()) {
    setStatus('当前浏览器不支持语音合成。建议使用 Chrome、Safari 或 Edge。', 'warn');
    updatePlayerUI();
    updateNotebookUI();
    return;
  }
  refreshVoiceOptions();
  state.voiceCleanup = onVoicesChanged(() => {
    const previous = state.settings.voiceURI;
    refreshVoiceOptions();
    if (previous && el.voiceSelect.value !== previous) {
      // 系统音色列表尚未加载完成时不要覆盖已保存的选择
      const hasVoice = englishVoices().some((voice) => voice.voiceURI === previous);
      if (hasVoice) el.voiceSelect.value = previous;
    }
  });
}

/* ------------------------------------------------------------------ */
/* 导出 / 数据                                                         */
/* ------------------------------------------------------------------ */

function exportJSON(cards, prefix) {
  if (!cards.length) {
    toast('没有可导出的内容');
    return;
  }
  downloadFile(`${prefix}-${fileStamp()}.json`, cardsToJSON(cards), 'application/json;charset=utf-8');
  toast('已导出 JSON');
}

function exportCSV(cards, prefix) {
  if (!cards.length) {
    toast('没有可导出的内容');
    return;
  }
  downloadFile(`${prefix}-${fileStamp()}.csv`, cardsToAnkiCSV(cards), 'text/csv;charset=utf-8');
  toast('已导出 Anki CSV');
}

function onClearNotebook() {
  if (!state.notebook.length) return;
  if (!window.confirm(`确定清空生词本中的 ${state.notebook.length} 个术语？`)) return;
  state.notebook = [];
  saveNotebook([]);
  renderNotebook();
  refreshStars();
  toast('生词本已清空');
}

function onClearData() {
  if (!window.confirm('确定清除本地设置、生词本和上次学习结果？此操作不可恢复。')) return;
  stopAll();
  clearAllData();
  toast('已清除，正在刷新…');
  setTimeout(() => window.location.reload(), 500);
}

/* ------------------------------------------------------------------ */
/* 初始化                                                              */
/* ------------------------------------------------------------------ */

function restoreSession() {
  const session = loadSession();
  if (!session || !Array.isArray(session.cards) || !session.cards.length) return;

  state.cards = session.cards.map(normalizeCard).filter(Boolean);
  if (!state.cards.length) return;
  state.sourceTitle = session.sourceTitle || '';
  state.sourceUrl = session.sourceUrl || '';
  setSourceTitle(state.sourceTitle || '上次的学习卡');
  renderCards();
  el.progress.textContent = `${state.cards.length} / ${state.cards.length}`;
  setStatus(`已恢复上次的 ${state.cards.length} 个术语，可直接朗读。`, 'ok');
}

function bindEvents() {
  el.btnSettings.addEventListener('click', () => switchView('settings'));

  for (const tab of el.tabs) {
    tab.addEventListener('click', () => switchView(tab.dataset.view));
  }

  el.btnFetch.addEventListener('click', onFetch);
  el.btnExtract.addEventListener('click', onExtract);
  el.urlInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      onFetch();
    }
  });
  el.urlInput.addEventListener('input', () => {
    // 网址改了但正文还是上一次抓取的：清掉，避免提取到旧页面。
    if (
      state.lastFetchedUrl &&
      el.urlInput.value.trim() !== state.lastFetchedUrl &&
      el.textInput.value === state.lastFetchedText
    ) {
      el.textInput.value = '';
    }
  });

  el.btnPlay.addEventListener('click', startLearnPlay);
  el.btnStop.addEventListener('click', stopAll);
  el.btnNbPlay.addEventListener('click', startNotebookPlay);
  el.btnNbStop.addEventListener('click', stopAll);

  for (const button of el.segBtns) {
    button.addEventListener('click', () => {
      const mode = button.dataset.mode === 'quiz' ? 'quiz' : 'card';
      if (state.settings.mode === mode) return;
      state.settings.mode = mode;
      saveSettings(state.settings);
      updateModeUI();
      if (state.playing || state.singlePlaying) stopAll();
    });
  }

  el.loopToggle.addEventListener('change', () => {
    state.settings.loop = el.loopToggle.checked;
    saveSettings(state.settings);
  });

  el.playRate.addEventListener('input', (event) => onRateChange(event.target.value));
  el.rateSetting.addEventListener('input', (event) => onRateChange(event.target.value));

  el.btnSaveSettings.addEventListener('click', onSaveSettings);
  el.btnTest.addEventListener('click', onTestConnection);
  el.btnToggleKey.addEventListener('click', () => {
    const hidden = el.apiKey.type === 'password';
    el.apiKey.type = hidden ? 'text' : 'password';
    el.btnToggleKey.textContent = hidden ? '隐藏' : '显示';
  });

  el.voiceSelect.addEventListener('change', () => {
    state.settings.voiceURI = el.voiceSelect.value;
    saveSettings(state.settings);
    toast(el.voiceSelect.value ? '音色已切换' : '已改为自动音色');
  });

  el.quizDelay.addEventListener('change', () => {
    state.settings.quizDelay = Number(el.quizDelay.value) || 1500;
    saveSettings(state.settings);
  });

  el.btnRefreshVoices.addEventListener('click', () => {
    refreshVoiceOptions();
    const count = englishVoices().length;
    toast(count ? `已加载 ${count} 个英文音色` : '系统还没有返回音色，稍后再试');
  });

  el.btnExportJson.addEventListener('click', () => exportJSON(state.cards, 'terms'));
  el.btnExportCsv.addEventListener('click', () => exportCSV(state.cards, 'terms'));
  el.btnExportNbJson.addEventListener('click', () => exportJSON(state.notebook, 'notebook'));
  el.btnExportNbCsv.addEventListener('click', () => exportCSV(state.notebook, 'notebook'));
  el.btnClearNb.addEventListener('click', onClearNotebook);
  el.btnClearData.addEventListener('click', onClearData);
}

function init() {
  bindEvents();
  applySettingsToForm();
  el.nbCount.textContent = String(state.notebook.length);
  renderNotebook();
  updateModeUI();
  updatePlayerUI();
  updateNotebookUI();
  restoreSession();
  setupVoices();
}

init();
