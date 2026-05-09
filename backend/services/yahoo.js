import YahooFinance from 'yahoo-finance2';

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey', 'ripHistorical'] });

const TTL = { quote: 60, financials: 3600, history: 3600 };

import { withCache } from './redis.js';

export async function getQuote(ticker) {
  return withCache(`quote:${ticker}`, TTL.quote, () => yf.quote(ticker));
}

export async function getFinancials(ticker) {
  return withCache(`financials:${ticker}`, TTL.financials, () =>
    yf.quoteSummary(ticker, {
      modules: ['financialData', 'defaultKeyStatistics', 'earningsTrend',
                'cashflowStatementHistory', 'incomeStatementHistory'],
    })
  );
}

export async function getHistory(ticker) {
  const period2 = new Date().toISOString().split('T')[0];
  const d = new Date(); d.setFullYear(d.getFullYear() - 1);
  const period1 = d.toISOString().split('T')[0];
  return withCache(`history:${ticker}`, TTL.history, () =>
    yf.historical(ticker, { period1, period2, interval: '1d' })
  );
}

export async function getEarnings(ticker) {
  return withCache(`earnings:${ticker}`, TTL.financials, () =>
    yf.quoteSummary(ticker, { modules: ['earningsHistory', 'earningsTrend'] })
  );
}
