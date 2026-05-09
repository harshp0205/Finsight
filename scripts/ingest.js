#!/usr/bin/env node
// Usage: node scripts/ingest.js AAPL MSFT NVDA
// Fetches SEC filings and embeds them into pgvector

import 'dotenv/config';
import { indexTickerFilings } from '../backend/rag/indexer.js';

const tickers = process.argv.slice(2);
if (!tickers.length) {
  console.error('Usage: node scripts/ingest.js TICKER [TICKER...]');
  process.exit(1);
}

const FORM_TYPES = ['10-K', '10-Q'];

for (const ticker of tickers) {
  for (const form of FORM_TYPES) {
    try {
      const result = await indexTickerFilings(ticker.toUpperCase(), form, 2);
      console.log(`✓ ${ticker} ${form}: ${result.totalChunks} chunks indexed`);
    } catch (err) {
      console.error(`✗ ${ticker} ${form}: ${err.message}`);
    }
  }
}

console.log('Ingestion complete.');
process.exit(0);
