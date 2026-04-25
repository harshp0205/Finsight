-- Cosine similarity search for SEC filings
create or replace function match_sec_filings(
  query_embedding vector(768),
  match_ticker    text,
  match_count     int default 5
)
returns table (id uuid, ticker text, form_type text, filed_at date, raw_text text, similarity float)
language sql stable
as $$
  select id, ticker, form_type, filed_at, raw_text,
         1 - (embedding <=> query_embedding) as similarity
  from   sec_filings
  where  ticker = match_ticker
  order  by embedding <=> query_embedding
  limit  match_count;
$$;

-- Cosine similarity search for news articles
create or replace function match_news_articles(
  query_embedding vector(768),
  match_ticker    text,
  match_count     int default 5
)
returns table (id uuid, ticker text, title text, url text, sentiment_score numeric, published_at timestamptz, similarity float)
language sql stable
as $$
  select id, ticker, title, url, sentiment_score, published_at,
         1 - (embedding <=> query_embedding) as similarity
  from   news_articles
  where  ticker = match_ticker
  order  by embedding <=> query_embedding
  limit  match_count;
$$;
