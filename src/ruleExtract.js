import { GLOSSARY, sentenceFor, termRegex } from './glossary.js';

const STOPWORDS = new Set(
  `the and for are but not you all any can had her was one our out day get has him his how man new now old see two who boy did its let put say she too use that with have this will your from they know want been good much some time very when come here just like long make many more only over such take than them well were what when where which while who why will with would about after again against because been before being below between both during each few further here into once other same should their there these those through under until while above across almost along already also although always among another around away back become becomes before behind better beyond billion call called came cannot case certain change clear close come comes coming common company could course current day days different does done down during each early easy either else end enough even ever every example fact family far fast feel few find first five follow found four free from full general get give given go going good got great group grow half hand happen has have having he head hear help here high history hold home hour house how however huge human hundred idea important include including information inside instead interest into issue it its itself job keep kind know known large last late later lead learn least leave left less let level life light like likely line list little live local long look lot low made main major make making man many market matter may maybe mean means meet member men might million mind minute miss moment money month more morning most mother move much must name near need never new next night no none nor not note nothing now number of off offer office often oil old on once one only open or order other others our out over own part past people per perhaps place plan play point possible power present problem process product program provide public pull put quality question quick quite radio raise range rate rather reach read ready real really reason receive recent record red remain remember report require rest result return right rise road room rule run same save say school science score sea season seat second see seem sell send sense serve set seven several shall she short should show side sign since sing single six size skill small social some soon sort sound south space speak special spend stand start state stay step still stop story street strong student study such sure system take talk teach tell ten test than thank that the their them then there these they thing think third this those though thought thousand three through throw thus time to today together too took top toward town trade train tree true try turn two type under until up upon us use used very via view visit voice wait walk want war watch water way we week well went were what when where which while white who whole why wide wife will win wind window wish with within without woman wonder word work world worry would write wrong year yes yet you young your`,
);

const ACRONYM_EXCLUDE = new Set(
  `OK NOTE WARNING IMPORTANT TIP LAB LABS SOLVED PRACTITIONER APPRENTICE EXPERT NEW ALL THE AND FOR NOT YOU ARE BUT CAN ANY HOW WHY WHO WHAT WHEN THEN THIS THAT THESE THOSE WITH FROM HAVE WILL YOUR THEY THEM THERE WHERE WHICH WHILE ABOUT AFTER BEFORE HTML CSS JSON XML PDF TODO FIXME README`.split(
    /\s+/,
  ),
);

const TAG_BASE = {
  漏洞: 130,
  工具: 125,
  协议: 120,
  攻击: 118,
  防护: 116,
  概念: 92,
  其他: 82,
};

const CAP_START_EXCLUDE = new Set(
  `The This That These Those When Where Which While If In On At To For From With You Your We Our It Its As By Of And Or But Not No All Any Some More Most Each Every Both Either Neither Such What Why How Who Whom Whose Then Than Also However Because Before After During Under Over Between Through Using Use See Note Click Read Learn Find Get Make Take Give Work Example Solution`.split(
    /\s+/,
  ),
);

function normalizeText(text) {
  return String(text)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*_`]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function countMatches(text, re) {
  const matches = text.match(re);
  return matches ? matches.length : 0;
}

function looksLikeAcronym(term) {
  return /^[A-Z][A-Z0-9]{1,7}$/.test(term) || /[A-Z]{2,}/.test(term);
}

/**
 * 规则版提取：内置词表 > 大写缩写 > 大写词组 > 高频词。
 * 没有 API Key 时使用，能立刻出声，但释义质量有限。
 */
export function ruleExtract(text, limit = 15) {
  const clean = normalizeText(text);
  if (clean.length < 40) return [];

  const found = [];
  const seen = new Set();
  const coveredWords = new Set();

  const push = (card, score) => {
    const key = card.term.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    found.push({ ...card, score });
    for (const word of card.term.toLowerCase().split(/[^a-z0-9]+/)) {
      if (word.length > 2) coveredWords.add(word);
    }
  };

  // 1) 内置词表
  for (const entry of GLOSSARY) {
    const re = termRegex(entry.term, 'gi');
    const count = countMatches(clean, re);
    if (!count) continue;
    push(
      {
        term: entry.term,
        zh: entry.zh,
        example: sentenceFor(clean, entry.term),
        tag: entry.tag,
      },
      (TAG_BASE[entry.tag] || TAG_BASE.其他) +
        Math.min(count, 6) +
        (entry.term.includes(' ') ? 6 : 0) +
        (looksLikeAcronym(entry.term) ? 5 : 0),
    );
  }

  // 2) 正文中的大写缩写
  const acronymCounts = new Map();
  for (const match of clean.matchAll(/\b[A-Z][A-Z0-9]{1,7}\b/g)) {
    const term = match[0];
    if (ACRONYM_EXCLUDE.has(term)) continue;
    acronymCounts.set(term, (acronymCounts.get(term) || 0) + 1);
  }
  for (const [term, count] of acronymCounts) {
    push(
      {
        term,
        zh: '',
        example: sentenceFor(clean, term),
        tag: '术语',
      },
      60 + count * 2,
    );
  }

  // 3) 连续大写的两三个词，如 "Burp Suite"、"Web Security Academy"
  const phraseCounts = new Map();
  for (const match of clean.matchAll(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2}\b/g)) {
    const phrase = match[0];
    const first = phrase.split(/\s+/)[0];
    if (CAP_START_EXCLUDE.has(first)) continue;
    phraseCounts.set(phrase, (phraseCounts.get(phrase) || 0) + 1);
  }
  for (const [phrase, count] of phraseCounts) {
    if (count < 2) continue;
    push(
      {
        term: phrase,
        zh: '',
        example: sentenceFor(clean, phrase),
        tag: '术语',
      },
      40 + count * 2,
    );
  }

  // 4) 高频长词兜底
  if (found.length < limit) {
    const wordCounts = new Map();
    for (const match of clean.matchAll(/\b[A-Za-z][A-Za-z'-]{5,}\b/g)) {
      const lower = match[0].toLowerCase();
      if (STOPWORDS.has(lower)) continue;
      if (coveredWords.has(lower)) continue;
      const item = wordCounts.get(lower) || { count: 0, form: match[0] };
      item.count += 1;
      wordCounts.set(lower, item);
    }
    for (const [lower, item] of wordCounts) {
      if (item.count < 3) continue;
      if (coveredWords.has(lower)) continue;
      push(
        {
          term: item.form,
          zh: '',
          example: sentenceFor(clean, item.form),
          tag: '术语',
        },
        item.count,
      );
    }
  }

  return found
    .sort((a, b) => b.score - a.score || b.term.length - a.term.length)
    .slice(0, limit)
    .map(({ score, ...card }) => card);
}
