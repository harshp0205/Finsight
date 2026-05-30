import { generateWithContext } from '../services/llm.js';

const SOURCES = ['price', 'financials', 'filings', 'news', 'earnings', 'comparison'];

const KEYWORDS = {
  price:       ['price', 'trading', 'stock', 'buy', 'sell', 'worth', 'value', 'market cap'],
  financials:  ['revenue', 'profit', 'margin', 'eps', 'pe ratio', 'debt', 'cash', 'balance sheet', 'income'],
  filings:     ['10-k', '10-q', '8-k', 'sec', 'filing', 'annual report', 'quarterly'],
  news:        ['news', 'sentiment', 'recent', 'latest', 'today', 'headline'],
  earnings:    ['earnings', 'beat', 'miss', 'guidance', 'forecast', 'analyst', 'estimate', 'eps'],
  comparison:  ['vs', 'versus', 'compare', 'better', 'which', 'between'],
};

// Common Indian company name → Yahoo Finance ticker map
const INDIAN_TICKERS = {
  'infosys':          'INFY.NS',
  'tcs':              'TCS.NS',
  'tata consultancy': 'TCS.NS',
  'wipro':            'WIPRO.NS',
  'hcl':              'HCLTECH.NS',
  'hcl technologies': 'HCLTECH.NS',
  'reliance':         'RELIANCE.NS',
  'hdfc':             'HDFCBANK.NS',
  'hdfc bank':        'HDFCBANK.NS',
  'icici':            'ICICIBANK.NS',
  'icici bank':       'ICICIBANK.NS',
  'sbi':              'SBIN.NS',
  'state bank':       'SBIN.NS',
  'bajaj':            'BAJFINANCE.NS',
  'airtel':           'BHARTIARTL.NS',
  'bharti airtel':    'BHARTIARTL.NS',
  'asian paints':     'ASIANPAINT.NS',
  'maruti':           'MARUTI.NS',
  'kotak':            'KOTAKBANK.NS',
  'l&t':              'LT.NS',
  'larsen':           'LT.NS',
  'itc':              'ITC.NS',
  'sun pharma':       'SUNPHARMA.NS',
  'axis bank':        'AXISBANK.NS',
};

function resolveIndianTicker(query) {
  const q = query.toLowerCase();
  for (const [name, ticker] of Object.entries(INDIAN_TICKERS)) {
    if (q.includes(name)) return ticker;
  }
  return null;
}

function keywordClassify(query) {
  const q = query.toLowerCase();
  return SOURCES.filter(src => KEYWORDS[src].some(kw => q.includes(kw)));
}

export async function classifyIntent(query) {
  // Check Indian company names first
  const indianTicker = resolveIndianTicker(query);

  try {
    const result = await generateWithContext(
      'You are a financial query classifier. Return only valid JSON, no explanation.',
      `Classify which financial data sources are needed and extract stock tickers.
Return JSON only: { "sources": [...], "tickers": [...] }
Sources must be a subset of: ${SOURCES.join(', ')}
Tickers: use Yahoo Finance format. US stocks: AAPL, NVDA. Indian stocks: INFY.NS, TCS.NS, RELIANCE.NS
If a company name is mentioned (e.g. "Infosys"), resolve it to the correct ticker.

Query: "${query}"`,
      ''
    );

    const json = result.match(/\{[\s\S]*\}/)?.[0];
    if (!json) throw new Error('no json');
    const parsed = JSON.parse(json);

    // Override with known Indian ticker if detected
    if (indianTicker && (!parsed.tickers?.length || parsed.tickers[0] === parsed.tickers[0]?.toUpperCase())) {
      parsed.tickers = [indianTicker, ...(parsed.tickers || []).filter(t => t !== indianTicker)];
    }

    return parsed;
  } catch {
    const sources = keywordClassify(query);
    const EXCLUDE = new Set(['A','I','Q','K','THE','AND','OR','VS','IN','OF','FOR','ON','AT']);
    const tickers = indianTicker
      ? [indianTicker]
      : (query.match(/\b[A-Z]{1,5}\b/g) || []).filter(t => !EXCLUDE.has(t));
    return { sources: sources.length ? sources : ['price', 'news'], tickers };
  }
}
