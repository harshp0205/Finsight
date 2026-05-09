import type { Quote, HistoryPoint, NewsArticle, Sentiment, Filing, Portfolio, PortfolioPerformance, Message, Conversation } from './types';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

async function get<T>(path: string, token?: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function post<T>(path: string, body: unknown, token?: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function del(path: string, token?: string): Promise<void> {
  await fetch(`${BASE}${path}`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

// Stock
export const stockApi = {
  quote: (ticker: string) => get<Quote>(`/stock/${ticker}`),
  history: (ticker: string) => get<HistoryPoint[]>(`/stock/${ticker}/history`),
  financials: (ticker: string) => get<unknown>(`/stock/${ticker}/financials`),
  news: (ticker: string) => get<{ articles: NewsArticle[]; sentiment: Sentiment }>(`/stock/${ticker}/news`),
  filings: (ticker: string) => get<Filing[]>(`/stock/${ticker}/filings`),
  earnings: (ticker: string) => get<unknown>(`/stock/${ticker}/earnings`),
};

// Chat — returns EventSource for SSE
export function chatStream(message: string, conversationId: string | null, token: string) {
  return fetch(`${BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ message, conversationId }),
  });
}

export const chatApi = {
  history: (token: string) => get<Conversation[]>('/chat/history', token),
  messages: (id: string, token: string) => get<Message[]>(`/chat/${id}/messages`, token),
};

// Portfolio
export const portfolioApi = {
  list: (token: string) => get<Portfolio[]>('/portfolio', token),
  create: (name: string, token: string) => post<Portfolio>('/portfolio', { name }, token),
  addHolding: (id: string, ticker: string, shares: number, avg_buy_price: number, token: string) =>
    post(`/portfolio/${id}/holdings`, { ticker, shares, avg_buy_price }, token),
  performance: (id: string, token: string) => get<PortfolioPerformance>(`/portfolio/${id}/performance`, token),
  deleteHolding: (portfolioId: string, holdingId: string, token: string) =>
    del(`/portfolio/${portfolioId}/holdings/${holdingId}`, token),
};

// Watchlist
export const watchlistApi = {
  list: (token: string) => get<{ ticker: string; id: string }[]>('/watchlist', token),
  add: (ticker: string, token: string) => post('/watchlist', { ticker }, token),
  remove: (id: string, token: string) => del(`/watchlist/${id}`, token),
};
