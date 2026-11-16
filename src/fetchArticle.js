const JINA_READER = 'https://r.jina.ai/';
const MAX_TEXT = 80000;

/** 允许用户只输入 example.com，自动补 https:// */
export function normalizeUrl(raw) {
  let value = String(raw || '').trim();
  if (!value) throw new Error('请输入网页地址');
  if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error('网址格式不正确');
  }
  if (!parsed.hostname || !parsed.hostname.includes('.')) {
    throw new Error('网址格式不正确');
  }
  return parsed.toString();
}

/** 去掉 Markdown 标记，保留正文文字。 */
export function cleanText(raw) {
  let text = String(raw || '')
    .replace(/\r\n?/g, '\n')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^\s*URL Source:.*$/gim, '')
    .replace(/^\s*Markdown Content:\s*$/gim, '')
    .replace(/```[a-zA-Z0-9_-]*\n?/g, '')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/^\s*(?:[-*+•]|\d+\.)\s+/gm, '')
    .replace(/<[^>\n]{1,120}>/g, ' ')
    .replace(/[*_`~]{2,}/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
  if (text.length > MAX_TEXT) text = `${text.slice(0, MAX_TEXT)}\n\n[正文过长，已截断]`;
  return text;
}

function parseJina(raw, sourceUrl) {
  const titleMatch = raw.match(/^Title:\s*(.+)$/m);
  let content = raw;
  const marker = raw.indexOf('Markdown Content:');
  if (marker !== -1) content = raw.slice(marker + 'Markdown Content:'.length);

  const text = cleanText(content);
  const title = (titleMatch?.[1] || '').trim() || new URL(sourceUrl).hostname;

  if (!text || text.length < 60) {
    throw new Error('抓到的正文太短，可能需要登录或页面由 JavaScript 动态渲染');
  }
  return { title, text, url: sourceUrl };
}

/**
 * 通过 r.jina.ai 公共阅读代理抓取网页正文。
 * 零后端方案；受第三方速率限制，失败时请手动粘贴正文。
 */
export async function fetchArticle(rawUrl, { timeout = 35000 } = {}) {
  const url = normalizeUrl(rawUrl);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(`${JINA_READER}${url}`, {
      method: 'GET',
      headers: { Accept: 'text/plain' },
      signal: controller.signal,
      redirect: 'follow',
    });

    if (!res.ok) {
      if (res.status === 429) {
        throw new Error('公共抓取代理限流（HTTP 429），请稍后再试或手动粘贴正文');
      }
      if (res.status === 401 || res.status === 403) {
        throw new Error(`抓取被拒绝（HTTP ${res.status}），请手动粘贴正文`);
      }
      throw new Error(`抓取失败（HTTP ${res.status}）`);
    }

    const raw = await res.text();
    if (!raw || raw.trim().length < 20) {
      throw new Error('抓取结果为空，请手动粘贴正文');
    }
    if (/Target URL returned error|Failed to fetch|Unable to retrieve/i.test(raw.slice(0, 800))) {
      throw new Error('目标页面拒绝抓取或需要登录，请手动粘贴正文');
    }
    if (/<html[\s>]/i.test(raw.slice(0, 1200)) && !/Markdown Content:/i.test(raw)) {
      throw new Error('抓取到的是拦截页面，请手动粘贴正文');
    }
    return parseJina(raw, url);
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw new Error('抓取超时，请稍后重试或手动粘贴正文');
    }
    if (err instanceof TypeError) {
      throw new Error('网络请求失败（可能是代理、CORS 或断网），请手动粘贴正文');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
