export interface Quote {
  symbol: string;
  regularMarketPrice: number;
  regularMarketChangePercent: number;
  regularMarketChange: number;
  marketCap: number;
  trailingPE: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  shortName: string;
  volume: number;
}

export interface HistoryPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface NewsArticle {
  title: string;
  url: string;
  publishedAt: string;
  source: string;
}

export interface Sentiment {
  score: number;
  label: 'bullish' | 'neutral' | 'bearish';
}

export interface Filing {
  accessionNumber: string;
  filedAt: string;
  primaryDocument: string;
  url: string;
}

export interface Holding {
  id: string;
  ticker: string;
  shares: number;
  avg_buy_price: number;
  currentPrice?: number;
  currentValue?: number;
  costBasis?: number;
  gainLoss?: number;
  gainLossPct?: number;
}

export interface Portfolio {
  id: string;
  name: string;
  holdings: Holding[];
}

export interface PortfolioPerformance {
  holdings: Holding[];
  totalValue: number;
  totalCost: number;
  totalGainLoss: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  created_at: string;
}

export interface Citation {
  type: 'filing' | 'news' | 'price';
  ref: string;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
}
