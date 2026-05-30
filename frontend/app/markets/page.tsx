'use client';
import { useState, useEffect } from 'react';
import { stockApi } from '@/lib/api';
import { QuoteCard } from '@/components/Stock/QuoteCard';
import { Spinner } from '@/components/UI/Spinner';
import Link from 'next/link';
import type { Quote } from '@/lib/types';

const SECTIONS = [
  {
    label: 'Indian Markets',
    tickers: ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'WIPRO', 'BAJFINANCE', 'SBIN'],
  },
  {
    label: 'US Markets',
    tickers: ['AAPL', 'NVDA', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'AMD'],
  },
];

export default function MarketsPage() {
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const all = SECTIONS.flatMap(s => s.tickers);
    Promise.allSettled(all.map(t => stockApi.quote(t).then(q => ({ t, q }))))
      .then(results => {
        const map: Record<string, Quote> = {};
        results.forEach(r => { if (r.status === 'fulfilled') map[r.value.t] = r.value.q; });
        setQuotes(map);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center pt-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-bold text-white">Markets</h1>
      {SECTIONS.map(({ label, tickers }) => (
        <section key={label}>
          <h2 className="text-lg font-semibold text-gray-300 mb-4">{label}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {tickers.map(t => (
              <Link key={t} href={`/stock/${t}`} className="block hover:scale-[1.02] transition-transform">
                {quotes[t]
                  ? <QuoteCard quote={quotes[t]} />
                  : <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex justify-center items-center h-40"><Spinner /></div>
                }
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
