const synth = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;

let generation = 0;
const pending = new Set();

export function speechSupported() {
  return Boolean(synth && typeof window.SpeechSynthesisUtterance === 'function');
}

export function loadVoices() {
  if (!synth) return [];
  try {
    return synth.getVoices() || [];
  } catch {
    return [];
  }
}

export function onVoicesChanged(callback) {
  if (!synth) return () => {};
  const handler = () => callback(loadVoices());
  if (typeof synth.addEventListener === 'function') {
    synth.addEventListener('voiceschanged', handler);
    return () => synth.removeEventListener('voiceschanged', handler);
  }
  synth.onvoiceschanged = handler;
  return () => {
    synth.onvoiceschanged = null;
  };
}

export function englishVoices() {
  return loadVoices().filter((voice) => /^en([-_]|$)/i.test(voice.lang || ''));
}

export function chineseVoices() {
  return loadVoices().filter((voice) => /^(zh|cmn)([-_]|$)/i.test(voice.lang || ''));
}

export function pickEnglishVoice(preferredURI) {
  const voices = englishVoices();
  if (!voices.length) return null;
  if (preferredURI) {
    const exact = voices.find((voice) => voice.voiceURI === preferredURI);
    if (exact) return exact;
  }
  return (
    voices.find((voice) => /^en[-_](US|GB)/i.test(voice.lang || '')) ||
    voices.find((voice) => /^en[-_]/i.test(voice.lang || '')) ||
    voices[0]
  );
}

export function pickChineseVoice() {
  const voices = chineseVoices();
  if (!voices.length) return null;
  return (
    voices.find((voice) => /^(zh[-_](CN|Hans)|cmn[-_]CN)/i.test(voice.lang || '')) ||
    voices[0]
  );
}

export function stopSpeaking() {
  generation += 1;
  const resolvers = [...pending];
  pending.clear();
  for (const finish of resolvers) {
    try {
      finish();
    } catch {
      // ignore
    }
  }
  if (synth) {
    try {
      synth.cancel();
    } catch {
      // ignore
    }
  }
}

/** 开始一次新的播放，返回本次会话编号。 */
export function beginPlayback() {
  stopSpeaking();
  return generation;
}

export function isStale(session) {
  return session !== generation;
}

/**
 * 朗读一段文本。停止播放或取消时会立即 resolve。
 */
export function speak(text, { lang = 'en-US', rate = 1, voice = null, pitch = 1 } = {}) {
  if (!synth) return Promise.reject(new Error('当前浏览器不支持语音合成'));
  const value = String(text ?? '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!value) return Promise.resolve();

  return new Promise((resolve) => {
    let settled = false;
    let timer = null;

    const finish = () => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      pending.delete(finish);
      resolve();
    };

    const utterance = new SpeechSynthesisUtterance(value);
    utterance.lang = lang;
    utterance.rate = Math.min(2, Math.max(0.5, Number(rate) || 1));
    utterance.pitch = Math.min(2, Math.max(0, Number(pitch) || 1));
    if (voice) utterance.voice = voice;

    utterance.onend = finish;
    utterance.onerror = finish;

    pending.add(finish);
    timer = setTimeout(finish, Math.min(120000, Math.max(6000, value.length * 420)));

    try {
      synth.speak(utterance);
    } catch {
      finish();
    }
  });
}

/** 可被停止打断的等待。返回 false 表示本次播放已被取消。 */
export function wait(ms, session) {
  return new Promise((resolve) => {
    const started = Date.now();
    const tick = () => {
      if (isStale(session)) {
        resolve(false);
        return;
      }
      const left = ms - (Date.now() - started);
      if (left <= 0) {
        resolve(true);
        return;
      }
      setTimeout(tick, Math.min(100, left));
    };
    tick();
  });
}
