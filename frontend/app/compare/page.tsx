'use client';
import { useState } from 'react';
import { stockApi } from '@/lib/api';
import { fmtCurrency, fmtBillions, fmtPct, fmt, colorPct } from '@/lib/utils';
import { Spinner } from '@/components/UI/Spinner';
import { Plus } from 'lucide-react';
import type { Quote } from '@/lib/types';

const METRICS: [string, (q: Quote, f: any) => string][] = [
  ['Price',          (q) => fmtCurrency(q.regularMarketPrice)],
  ['Change',         (q) => fmtPct(q.regularMarketChangePercent)],
  ['Market Cap',     (q) => fmtBillions(q.marketCap)],
  ['P/E Ratio',      (q) => fmt(q.trailingPE)],
  ['52W High',       (q) => fmtCurrency(q.fiftyTwoWeekHigh)],
  ['52W Low',        (q) => fmtCurrency(q.fiftyTwoWeekLow)],
  ['Volume',         (q) => fmt(q.volume, 0)],
];

export default function ComparePage() {
  const [tickers, setTickers] = useState<string[]>(['NVDA', 'AMD']);
  const [quotes, setQuotes] = useState<Record<string, Quote | null>>({});
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState('');

  const load = async (list: string[]) => {
    setLoading(true);
    const results = await Promise.allSettled(list.map(t => stockApi.quote(t)));
    const map: Record<string, Quote | null> = {};
    list.forEach((t, i) => {
      map[t] = results[i].status === 'fulfilled' ? results[i].value : null;
    });
    setQuotes(map);
    setLoading(false);
  };

  const add = () => {
    const t = input.trim().toUpperCase();
    if (!t || tickers.includes(t) || tickers.length >= 4) return;
    const next = [...tickers, t];
    setTickers(next);
    setInput('');
    load(next);
  };

  // Initial load
  useState(() => { load(tickers); });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Compare Stocks</h1>
        <div className="flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && add()}
            placeholder="Add ticker…"
            disabled={tickers.length >= 4}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-500 w-32 disabled:opacity-50" />
          <button onClick={add} disabled={tickers.length >= 4}
            className="flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm rounded-lg transition-colors">
            <Plus size={16} /> Add
          </button>
          <button onClick={() => load(tickers)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors">
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center pt-20"><Spinner size="lg" /></div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-5 py-4 text-left text-gray-400 font-medium w-40">Metric</th>
                {tickers.map(t => (
                  <th key={t} className="px-5 py-4 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold">{t}</span>
                      <button onClick={() => {
                        const next = tickers.filter(x => x !== t);
                        setTickers(next);
                      }} className="text-gray-600 hover:text-red-400 text-xs">✕</button>
                    </div>
                    {quotes[t] && <p className="text-gray-400 text-xs font-normal">{quotes[t]?.shortName}</p>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {METRICS.map(([label, fn]) => (
                <tr key={label} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                  <td className="px-5 py-3 text-gray-400">{label}</td>
                  {tickers.map(t => {
                    const q = quotes[t];
                    const val = q ? fn(q, null) : '—';
                    const isChange = label === 'Change';
                    return (
                      <td key={t} className={`px-5 py-3 font-medium ${
                        isChange && q ? colorPct(q.regularMarketChangePercent) : 'text-white'
                      }`}>
                        {val}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
