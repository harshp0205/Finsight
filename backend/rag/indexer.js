import { getFilings, fetchFilingText } from '../services/edgar.js';
import { chunkFiling } from './chunker.js';
import { embedBatch, storeFilingEmbeddings } from './embeddings.js';

export async function indexTickerFilings(ticker, formType = '10-K', count = 3) {
  console.log(`[indexer] Fetching ${formType} filings for ${ticker}...`);
  const filings = await getFilings(ticker, formType, count);

  let total = 0;
  for (const filing of filings) {
    console.log(`[indexer] Processing ${filing.filedAt} ${formType}...`);
    const rawText = await fetchFilingText(filing.url);
    const chunks = chunkFiling(rawText, ticker, formType, filing.filedAt, filing.url);
    console.log(`[indexer] Embedding ${chunks.length} chunks...`);
    const embedded = await embedBatch(chunks);
    const stored = await storeFilingEmbeddings(ticker, formType, filing.filedAt, embedded);
    console.log(`[indexer] Stored ${stored} chunks for ${filing.filedAt}`);
    total += stored;
  }

  return { ticker, formType, totalChunks: total };
}
