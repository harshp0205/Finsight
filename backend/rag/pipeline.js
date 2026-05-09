import { classifyIntent } from './intent.js';
import { retrieveAll } from './retrieval.js';
import { getQuote, getFinancials, getEarnings } from '../services/yahoo.js';
import { getNews } from '../services/news.js';
import { getLLM } from '../services/llm.js';

const SYSTEM_PROMPT = `You are FinSight, an institutional-grade AI financial analyst.
Rules:
- Back every claim with data from the provided context
- Cite sources inline as [Filing: 10-K 2024], [News: headline], [Price: $X]
- Flag speculation clearly with "Note:"
- Be concise but thorough — use sections and bullet points
- Never fabricate numbers`;

function buildContext(sources, liveData, ragChunks) {
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

  return parts.join('\n\n');
}

export async function runPipeline(query, conversationHistory = []) {
  // Step 1: classify intent
  const intent = await classifyIntent(query);
  const ticker = intent.tickers?.[0];

  // Step 2: parallel data fetch based on intent
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

  // Step 3: build context
  const context = buildContext(needed, liveData, chunks);

  // Step 4: build conversation history string
  const history = conversationHistory.slice(-6).map(m =>
    `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
  ).join('\n');

  const fullPrompt = `${SYSTEM_PROMPT}

${history ? `## Conversation History\n${history}\n` : ''}
## Context
${context}

## Question
${query}`;

  // Step 5: LLM call
  const model = getLLM();
  const result = await model.generateContent(fullPrompt);
  const answer = result.response.text();

  // Step 6: extract citations
  const citations = [
    ...([...answer.matchAll(/\[Filing: ([^\]]+)\]/g)].map(m => ({ type: 'filing', ref: m[1] }))),
    ...([...answer.matchAll(/\[News: ([^\]]+)\]/g)].map(m => ({ type: 'news', ref: m[1] }))),
    ...([...answer.matchAll(/\[Price: ([^\]]+)\]/g)].map(m => ({ type: 'price', ref: m[1] }))),
  ];

  return { answer, citations, intent, ticker };
}

// Streaming variant — yields text chunks via async generator
export async function* streamPipeline(query, conversationHistory = []) {
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

  const context = buildContext(needed, liveData, chunks);
  const history = conversationHistory.slice(-6).map(m =>
    `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
  ).join('\n');

  const fullPrompt = `${SYSTEM_PROMPT}\n\n${history ? `## Conversation History\n${history}\n` : ''}## Context\n${context}\n\n## Question\n${query}`;

  const model = getLLM();
  const streamResult = await model.generateContentStream(fullPrompt);

  let fullText = '';
  for await (const chunk of streamResult.stream) {
    const text = chunk.text();
    fullText += text;
    yield { type: 'chunk', text };
  }

  const citations = [
    ...([...fullText.matchAll(/\[Filing: ([^\]]+)\]/g)].map(m => ({ type: 'filing', ref: m[1] }))),
    ...([...fullText.matchAll(/\[News: ([^\]]+)\]/g)].map(m => ({ type: 'news', ref: m[1] }))),
    ...([...fullText.matchAll(/\[Price: ([^\]]+)\]/g)].map(m => ({ type: 'price', ref: m[1] }))),
  ];

  yield { type: 'done', citations, intent, ticker };
}
