import fetch from 'node-fetch';
import { withCache } from './redis.js';

const BASE = 'https://data.sec.gov';
const HEADERS = { 'User-Agent': 'FinSight/1.0 kumar.harsh@smallcase.com' };
const TTL = 7 * 24 * 3600; // 7 days

async function getCIK(ticker) {
  return withCache(`cik:${ticker}`, TTL, async () => {
    const res = await fetch(`${BASE}/submissions/CIK.json`, { headers: HEADERS });
    // EDGAR ticker→CIK map
    const map = await fetch(
      'https://www.sec.gov/files/company_tickers.json',
      { headers: HEADERS }
    ).then((r) => r.json());
    const entry = Object.values(map).find(
      (c) => c.ticker.toUpperCase() === ticker.toUpperCase()
    );
    if (!entry) throw new Error(`CIK not found for ${ticker}`);
    return String(entry.cik_str).padStart(10, '0');
  });
}

export async function getFilings(ticker, formType = '10-K', count = 5) {
  const cik = await getCIK(ticker);
  return withCache(`filings:${ticker}:${formType}`, TTL, async () => {
    const res = await fetch(
      `${BASE}/submissions/CIK${cik}.json`,
      { headers: HEADERS }
    );
    const data = await res.json();
    const filings = data.filings.recent;
    const results = [];

    for (let i = 0; i < filings.form.length && results.length < count; i++) {
      if (filings.form[i] === formType) {
        results.push({
          accessionNumber: filings.accessionNumber[i],
          filedAt: filings.filingDate[i],
          primaryDocument: filings.primaryDocument[i],
          url: `https://www.sec.gov/Archives/edgar/data/${parseInt(cik)}/${
            filings.accessionNumber[i].replace(/-/g, '')
          }/${filings.primaryDocument[i]}`,
        });
      }
    }
    return results;
  });
}

export async function fetchFilingText(url) {
  const res = await fetch(url, { headers: HEADERS });
  const html = await res.text();
  // strip tags for plain text (~rough parse)
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}
