'use client';
import { useEffect, useState } from 'react';
import { stockApi } from '@/lib/api';
import type { Quote, HistoryPoint, NewsArticle, Sentiment } from '@/lib/types';

export function useQuote(ticker: string) {
  const [data, setData] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticker) return;
    setLoading(true);
    stockApi.quote(ticker)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [ticker]);

  return { data, loading, error };
}

export function useHistory(ticker: string) {
  const [data, setData] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ticker) return;
    stockApi.history(ticker)
      .then(setData)
      .finally(() => setLoading(false));
  }, [ticker]);

  return { data, loading };
}

export function useNews(ticker: string) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [sentiment, setSentiment] = useState<Sentiment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ticker) return;
    stockApi.news(ticker).then(d => {
      setArticles(d.articles);
      setSentiment(d.sentiment);
    }).finally(() => setLoading(false));
  }, [ticker]);

  return { articles, sentiment, loading };
}
