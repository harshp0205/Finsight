-- Enable pgvector
create extension if not exists vector;

-- Users table is managed by Supabase Auth (auth.users)
-- We reference it via user_id uuid

create table if not exists portfolios (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  created_at  timestamptz default now()
);

create table if not exists holdings (
  id              uuid primary key default gen_random_uuid(),
  portfolio_id    uuid not null references portfolios(id) on delete cascade,
  ticker          text not null,
  shares          numeric not null,
  avg_buy_price   numeric not null,
  added_at        timestamptz default now()
);

create table if not exists watchlists (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  ticker      text not null,
  added_at    timestamptz default now(),
  unique(user_id, ticker)
);

create table if not exists conversations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text,
  created_at  timestamptz default now()
);

create table if not exists messages (
  id                  uuid primary key default gen_random_uuid(),
  conversation_id     uuid not null references conversations(id) on delete cascade,
  role                text not null check (role in ('user', 'assistant')),
  content             text not null,
  citations           jsonb,
  created_at          timestamptz default now()
);

create table if not exists stock_cache (
  ticker      text primary key,
  data_json   jsonb not null,
  cached_at   timestamptz default now()
);

create table if not exists sec_filings (
  id          uuid primary key default gen_random_uuid(),
  ticker      text not null,
  form_type   text not null,
  filed_at    date,
  raw_text    text,
  embedding   vector(768),
  created_at  timestamptz default now()
);

create table if not exists news_articles (
  id              uuid primary key default gen_random_uuid(),
  ticker          text not null,
  title           text not null,
  url             text unique,
  sentiment_score numeric,
  published_at    timestamptz,
  embedding       vector(768),
  created_at      timestamptz default now()
);

create table if not exists alerts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  ticker          text not null,
  condition       jsonb not null,
  triggered_at    timestamptz,
  created_at      timestamptz default now()
);

-- Indexes
create index if not exists idx_holdings_portfolio on holdings(portfolio_id);
create index if not exists idx_messages_conversation on messages(conversation_id);
create index if not exists idx_sec_filings_ticker on sec_filings(ticker);
create index if not exists idx_news_ticker on news_articles(ticker);
create index if not exists idx_alerts_user on alerts(user_id);

-- pgvector cosine similarity indexes (IVFFlat)
create index if not exists idx_sec_embedding on sec_filings
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);

create index if not exists idx_news_embedding on news_articles
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- RLS
alter table portfolios enable row level security;
alter table holdings enable row level security;
alter table watchlists enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table alerts enable row level security;

create policy "own portfolios" on portfolios for all using (auth.uid() = user_id);
create policy "own holdings" on holdings for all using (
  portfolio_id in (select id from portfolios where user_id = auth.uid())
);
create policy "own watchlists" on watchlists for all using (auth.uid() = user_id);
create policy "own conversations" on conversations for all using (auth.uid() = user_id);
create policy "own messages" on messages for all using (
  conversation_id in (select id from conversations where user_id = auth.uid())
);
create policy "own alerts" on alerts for all using (auth.uid() = user_id);
