import yahooFinance from 'yahoo-finance2';
import { withCache } from './redis.js';

const TTL = { quote: 60, financials: 3600, history: 3600 };

export async function getQuote(ticker) {
  return withCache(`quote:${ticker}`, TTL.quote, () =>
    yahooFinance.quote(ticker)
  );
}

export async function getFinancials(ticker) {
  return withCache(`financials:${ticker}`, TTL.financials, async () => {
    const [summary, cashFlow, incomeStatement] = await Promise.all([
      yahooFinance.quoteSummary(ticker, {
        modules: ['financialData', 'defaultKeyStatistics', 'earningsTrend'],
      }),
      yahooFinance.quoteSummary(ticker, { modules: ['cashflowStatementHistory'] }),
      yahooFinance.quoteSummary(ticker, { modules: ['incomeStatementHistory'] }),
    ]);
    return { summary, cashFlow, incomeStatement };
  });
}

export async function getHistory(ticker, period = '1y') {
  const period1 = new Date();
  period1.setFullYear(period1.getFullYear() - 1);
  return withCache(`history:${ticker}:${period}`, TTL.history, () =>
    yahooFinance.historical(ticker, { period1, interval: '1d' })
  );
}

export async function getEarnings(ticker) {
  return withCache(`earnings:${ticker}`, TTL.financials, () =>
    yahooFinance.quoteSummary(ticker, {
      modules: ['earningsHistory', 'earningsTrend'],
    })
  );
}
