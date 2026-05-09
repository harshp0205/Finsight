// Classify which data sources are needed for a given query.
// Falls back to keyword matching if Gemini is unavailable.

import { getLLM } from '../services/llm.js';

const SOURCES = ['price', 'financials', 'filings', 'news', 'earnings', 'comparison'];

const KEYWORDS = {
  price:       ['price', 'trading', 'stock', 'buy', 'sell', 'worth', 'value', 'market cap'],
  financials:  ['revenue', 'profit', 'margin', 'eps', 'pe ratio', 'debt', 'cash', 'balance sheet', 'income'],
  filings:     ['10-k', '10-q', '8-k', 'sec', 'filing', 'annual report', 'quarterly'],
  news:        ['news', 'sentiment', 'recent', 'latest', 'today', 'headline'],
  earnings:    ['earnings', 'beat', 'miss', 'guidance', 'forecast', 'analyst', 'estimate', 'eps'],
  comparison:  ['vs', 'versus', 'compare', 'better', 'which', 'between'],
};

function keywordClassify(query) {
  const q = query.toLowerCase();
  return SOURCES.filter(src => KEYWORDS[src].some(kw => q.includes(kw)));
}

export async function classifyIntent(query) {
  try {
    const model = getLLM();
    const prompt = `Classify which financial data sources are needed to answer this query.
Return JSON only: { "sources": [...], "tickers": [...] }
Sources must be a subset of: ${SOURCES.join(', ')}
Tickers: extract any stock tickers mentioned (uppercase, e.g. AAPL).

Query: "${query}"`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const json = text.match(/\{[\s\S]*\}/)?.[0];
    if (!json) throw new Error('no json');
    return JSON.parse(json);
  } catch {
    // Fallback: keyword-based classification
    const sources = keywordClassify(query);
    // Exclude common non-ticker uppercase words and form types
    const EXCLUDE = new Set(['A','I','Q','K','THE','AND','OR','VS','IN','OF','FOR','ON','AT']);
    const tickers = (query.match(/\b[A-Z]{1,5}\b/g) || []).filter(t => !EXCLUDE.has(t));
    return { sources: sources.length ? sources : ['price', 'news'], tickers };
  }
}
