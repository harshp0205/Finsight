import { getEmbeddingModel } from '../services/llm.js';
import { supabase } from '../services/supabase.js';

// Gemini text-embedding-004 outputs 768-dim vectors
export async function embedChunk(text) {
  const model = getEmbeddingModel();
  const result = await model.embedContent(text);
  return result.embedding.values;
}

// Batch embed with rate-limit safety (Gemini free: 1500 req/min)
export async function embedBatch(chunks, delayMs = 50) {
  const results = [];
  for (const chunk of chunks) {
    const embedding = await embedChunk(chunk.content);
    results.push({ ...chunk, embedding });
    if (delayMs) await new Promise(r => setTimeout(r, delayMs));
  }
  return results;
}

export async function storeFilingEmbeddings(ticker, formType, filedAt, chunks) {
  const rows = chunks.map(c => ({
    ticker,
    form_type: formType,
    filed_at: filedAt,
    raw_text: c.content,
    embedding: JSON.stringify(c.embedding),
  }));

  const { error } = await supabase.from('sec_filings').insert(rows);
  if (error) throw error;
  return rows.length;
}

export async function storeNewsEmbeddings(ticker, articleMeta, chunks) {
  const rows = chunks.map(c => ({
    ticker,
    title: articleMeta.title,
    url: articleMeta.url,
    published_at: articleMeta.publishedAt,
    raw_text: c.content,
    embedding: JSON.stringify(c.embedding),
  }));

  const { error } = await supabase.from('news_articles').insert(rows);
  if (error) throw error;
  return rows.length;
}
