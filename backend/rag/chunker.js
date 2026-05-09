const CHUNK_SIZE = 500;   // tokens (approx 4 chars each)
const CHUNK_OVERLAP = 50;

function approxTokens(text) {
  return Math.ceil(text.length / 4);
}

export function chunkText(text, metadata = {}) {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks = [];
  let start = 0;

  while (start < words.length) {
    const slice = words.slice(start, start + CHUNK_SIZE);
    const content = slice.join(' ');
    chunks.push({ content, metadata: { ...metadata, chunkIndex: chunks.length } });
    if (slice.length < CHUNK_SIZE) break;
    start += CHUNK_SIZE - CHUNK_OVERLAP;
  }

  return chunks;
}

export function chunkFiling(rawText, ticker, formType, filedAt, url) {
  // Strip boilerplate SEC headers before chunking
  const cleaned = rawText
    .replace(/UNITED STATES SECURITIES[\s\S]{0,500}COMMISSION/gi, '')
    .replace(/Table of Contents/gi, '')
    .replace(/\s{3,}/g, ' ')
    .trim();

  return chunkText(cleaned, { ticker, formType, filedAt, url, source: 'sec_filing' });
}

export function chunkArticle(title, body, ticker, url, publishedAt) {
  const full = `${title}\n\n${body}`;
  return chunkText(full, { ticker, url, publishedAt, source: 'news' });
}
