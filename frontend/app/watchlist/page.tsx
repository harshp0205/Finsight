'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { stockApi, watchlistApi } from '@/lib/api';
import { QuoteCard } from '@/components/Stock/QuoteCard';
import { Spinner } from '@/components/UI/Spinner';
import { Plus, X } from 'lucide-react';
import type { Quote } from '@/lib/types';
import Link from 'next/link';

export default function WatchlistPage() {
  const { user, token } = useAuth();
  const [items, setItems] = useState<{ id: string; ticker: string }[]>([]);
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [loading, setLoading] = useState(true);
  const [newTicker, setNewTicker] = useState('');

  const loadQuotes = (tickers: string[]) => {
    Promise.allSettled(tickers.map(t => stockApi.quote(t).then(q => ({ t, q }))))
      .then(results => {
        const map: Record<string, Quote> = {};
        results.forEach(r => { if (r.status === 'fulfilled') map[r.value.t] = r.value.q; });
        setQuotes(map);
      });
  };

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    watchlistApi.list(token).then(data => {
      setItems(data);
      if (data.length) loadQuotes(data.map(d => d.ticker));
    }).finally(() => setLoading(false));
  }, [token]);

  const add = async () => {
    const t = newTicker.trim();
    if (!t || !token) return;
    const item = await watchlistApi.add(t, token) as { id: string; ticker: string };
    const updated = [...items, item];
    setItems(updated);
    loadQuotes(updated.map(d => d.ticker));
    setNewTicker('');
  };

  const remove = async (id: string) => {
    if (!token) return;
    await watchlistApi.remove(id, token);
    const updated = items.filter(i => i.id !== id);
    setItems(updated);
  };

  if (!user) return <p className="text-center text-gray-400 pt-20">Sign in to use your watchlist.</p>;
  if (loading) return <div className="flex justify-center pt-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Watchlist</h1>
        <div className="flex gap-2">
          <input value={newTicker} onChange={e => setNewTicker(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add()}
            placeholder="Add ticker… (TCS, AAPL)"
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-500 w-44" />
          <button onClick={add}
            className="flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors">
            <Plus size={16} />
          </button>
        </div>
      </div>

      {items.length === 0 && (
        <p className="text-gray-400 text-center py-16">No stocks in your watchlist yet. Add one above.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map(({ id, ticker }) => (
          <div key={id} className="relative group">
            <button onClick={() => remove(id)}
              className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all">
              <X size={14} />
            </button>
            <Link href={`/stock/${ticker}`}>
              {quotes[ticker]
                ? <QuoteCard quote={quotes[ticker]} />
                : <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex justify-center items-center h-40"><Spinner /></div>
              }
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
