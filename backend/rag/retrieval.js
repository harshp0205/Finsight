import { embedChunk } from './embeddings.js';
import { supabase } from '../services/supabase.js';

const TOP_K = 5;

export async function retrieveFilingChunks(ticker, query, k = TOP_K) {
  const embedding = await embedChunk(query);
  const { data, error } = await supabase.rpc('match_sec_filings', {
    query_embedding: embedding,
    match_ticker: ticker,
    match_count: k,
  });
  if (error) throw error;
  return data || [];
}

export async function retrieveNewsChunks(ticker, query, k = TOP_K) {
  const embedding = await embedChunk(query);
  const { data, error } = await supabase.rpc('match_news_articles', {
    query_embedding: embedding,
    match_ticker: ticker,
    match_count: k,
  });
  if (error) throw error;
  return data || [];
}

export async function retrieveAll(ticker, query) {
  const [filings, news] = await Promise.allSettled([
    retrieveFilingChunks(ticker, query),
    retrieveNewsChunks(ticker, query),
  ]);
  return {
    filings: filings.status === 'fulfilled' ? filings.value : [],
    news: news.status === 'fulfilled' ? news.value : [],
  };
}
