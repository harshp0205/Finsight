import { classifyIntent } from './intent.js';
import { retrieveAll } from './retrieval.js';
import { getQuote, getFinancials, getEarnings } from '../services/yahoo.js';
import { getNews } from '../services/news.js';
import { generateWithContext, streamCompletion } from '../services/llm.js';

const SYSTEM_PROMPT = `You are FinSight, an institutional-grade AI financial analyst with access to live market data.
CRITICAL RULES:
- The context below contains LIVE real-time data fetched right now — always use it to answer
- NEVER say you don't have access to real-time data — you DO via the context provided
- If price data is in the context, state it directly and confidently
- Cite sources inline: [Price: $X], [News: headline], [Filing: 10-K 2024]
- Be concise — answer the question directly first, then add detail
- Never fabricate numbers not present in the context`;

function buildContext(_sources, liveData, ragChunks) {
  const parts = [];

  if (liveData.quote) {
    const q = liveData.quote;
    parts.push(`## Live Quote
Ticker: ${q.symbol} | Price: $${q.regularMarketPrice} | Change: ${q.regularMarketChangePercent?.toFixed(2)}%
Market Cap: $${(q.marketCap / 1e9)?.toFixed(2)}B | P/E: ${q.trailingPE?.toFixed(2) || 'N/A'} | 52W High: $${q.fiftyTwoWeekHigh} | Low: $${q.fiftyTwoWeekLow}`);
  }

  if (liveData.financials) {
    const f = liveData.financials?.financialData;
    if (f) parts.push(`## Financials
Revenue: $${(f.totalRevenue?.raw / 1e9)?.toFixed(2)}B | Gross Margin: ${(f.grossMargins?.raw * 100)?.toFixed(1)}%
Operating Margin: ${(f.operatingMargins?.raw * 100)?.toFixed(1)}% | ROE: ${(f.returnOnEquity?.raw * 100)?.toFixed(1)}%
Free Cash Flow: $${(f.freeCashflow?.raw / 1e9)?.toFixed(2)}B | Debt/Equity: ${f.debtToEquity?.raw?.toFixed(2)}`);
  }

  if (liveData.earnings) {
    const trend = liveData.earnings?.earningsTrend?.trend?.[0];
    if (trend) parts.push(`## Earnings Trend
Next EPS Estimate: $${trend.epsEstimate?.avg?.toFixed(2)} | Revenue Estimate: $${(trend.revenueEstimate?.avg?.raw / 1e9)?.toFixed(2)}B`);
  }

  if (liveData.news?.length) {
    parts.push(`## Recent News\n${liveData.news.slice(0, 5).map(n => `- ${n.title} (${n.source})`).join('\n')}`);
  }

  if (ragChunks.filings?.length) {
    parts.push(`## SEC Filing Excerpts\n${ragChunks.filings.map(c =>
      `[${c.form_type} ${c.filed_at}] ${c.raw_text.slice(0, 300)}...`
    ).join('\n\n')}`);
  }

  if (ragChunks.news?.length) {
    parts.push(`## Relevant News Context\n${ragChunks.news.map(c =>
      `[${c.published_at?.slice(0, 10)}] ${c.raw_text.slice(0, 300)}...`
    ).join('\n\n')}`);
  }

  if (!parts.length) return 'No market data available for this query.';
  return parts.join('\n\n');
}

function extractCitations(text) {
  return [
    ...[...text.matchAll(/\[Filing: ([^\]]+)\]/g)].map(m => ({ type: 'filing', ref: m[1] })),
    ...[...text.matchAll(/\[News: ([^\]]+)\]/g)].map(m => ({ type: 'news', ref: m[1] })),
    ...[...text.matchAll(/\[Price: ([^\]]+)\]/g)].map(m => ({ type: 'price', ref: m[1] })),
  ];
}

async function gatherData(query) {
  const intent = await classifyIntent(query);
  const ticker = intent.tickers?.[0];
  const needed = intent.sources;

  const [quote, financials, earnings, news, ragChunks] = await Promise.allSettled([
    needed.includes('price') && ticker ? getQuote(ticker) : null,
    needed.includes('financials') && ticker ? getFinancials(ticker) : null,
    needed.includes('earnings') && ticker ? getEarnings(ticker) : null,
    needed.includes('news') && ticker ? getNews(ticker) : null,
    ticker ? retrieveAll(ticker, query) : { filings: [], news: [] },
  ]);

  const liveData = {
    quote:      quote.status === 'fulfilled' ? quote.value : null,
    financials: financials.status === 'fulfilled' ? financials.value : null,
    earnings:   earnings.status === 'fulfilled' ? earnings.value : null,
    news:       news.status === 'fulfilled' ? news.value : [],
  };
  const chunks = ragChunks.status === 'fulfilled' ? ragChunks.value : { filings: [], news: [] };

  const ctx = buildContext(needed, liveData, chunks);
  return { intent, ticker, context: ctx };
}

export async function runPipeline(query, conversationHistory = []) {
  const { intent, ticker, context } = await gatherData(query);
  const history = conversationHistory.slice(-6)
    .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n');

  const userMessage = history ? `${history}\n\nUser: ${query}` : query;
  const answer = await generateWithContext(SYSTEM_PROMPT, userMessage, context);
  return { answer, citations: extractCitations(answer), intent, ticker };
}

export async function* streamPipeline(query, conversationHistory = []) {
  const { intent, ticker, context } = await gatherData(query);
  const history = conversationHistory.slice(-6)
    .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n');

  const userMessage = history ? `${history}\n\nUser: ${query}` : query;

  let fullText = '';
  for await (const text of streamCompletion(SYSTEM_PROMPT, userMessage, context)) {
    fullText += text;
    yield { type: 'chunk', text };
  }

  yield { type: 'done', citations: extractCitations(fullText), intent, ticker };
}
