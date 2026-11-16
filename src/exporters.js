function compactCards(cards) {
  return (Array.isArray(cards) ? cards : []).map((card) => ({
    term: card.term || '',
    zh: card.zh || '',
    example: card.example || '',
    tag: card.tag || '',
  }));
}

export function cardsToJSON(cards) {
  return JSON.stringify(compactCards(cards), null, 2);
}

function csvCell(value) {
  const text = String(value ?? '')
    .replace(/\r?\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return `"${text.replace(/"/g, '""')}"`;
}

/** Anki 导入：逗号分隔，四列 = 术语 / 释义 / 例句 / 标签。 */
export function cardsToAnkiCSV(cards) {
  return compactCards(cards)
    .map((card) => [card.term, card.zh, card.example, card.tag].map(csvCell).join(','))
    .join('\n');
}

export function downloadFile(filename, text, type = 'text/plain;charset=utf-8') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function fileStamp(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(
    date.getHours(),
  )}${pad(date.getMinutes())}`;
}
