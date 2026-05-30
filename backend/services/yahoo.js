import YahooFinance from 'yahoo-finance2';
import { withCache } from './redis.js';

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey', 'ripHistorical'] });
const TTL = { quote: 60, financials: 3600, history: 3600 };

// If a bare ticker fails, try with .NS (NSE India) suffix
async function withNSFallback(ticker, fn) {
  try {
    return await fn(ticker);
  } catch (err) {
    if (!ticker.includes('.') && err.message?.includes('No data found')) {
      return await fn(`${ticker}.NS`);
    }
    throw err;
  }
}

export async function getQuote(ticker) {
  return withCache(`quote:${ticker}`, TTL.quote, () =>
    withNSFallback(ticker, t => yf.quote(t))
  );
}

export async function getFinancials(ticker) {
  return withCache(`financials:${ticker}`, TTL.financials, () =>
    withNSFallback(ticker, t => yf.quoteSummary(t, {
      modules: ['financialData', 'defaultKeyStatistics', 'earningsTrend',
                'cashflowStatementHistory', 'incomeStatementHistory'],
    }))
  );
}

export async function getHistory(ticker) {
  const period2 = new Date().toISOString().split('T')[0];
  const d = new Date(); d.setFullYear(d.getFullYear() - 1);
  const period1 = d.toISOString().split('T')[0];
  return withCache(`history:${ticker}`, TTL.history, () =>
    withNSFallback(ticker, t => yf.historical(t, { period1, period2, interval: '1d' }))
  );
}

export async function getEarnings(ticker) {
  return withCache(`earnings:${ticker}`, TTL.financials, () =>
    withNSFallback(ticker, t => yf.quoteSummary(t, { modules: ['earningsHistory', 'earningsTrend'] }))
  );
}
