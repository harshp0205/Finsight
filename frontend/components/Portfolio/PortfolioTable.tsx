'use client';
import { useState, useEffect } from 'react';
import { portfolioApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { fmtCurrency, fmtPct, colorPct, fmt } from '@/lib/utils';
import { Spinner } from '@/components/UI/Spinner';
import { Plus, Trash2 } from 'lucide-react';
import type { PortfolioPerformance } from '@/lib/types';

export function PortfolioTable({ portfolioId }: { portfolioId: string }) {
  const { token } = useAuth();
  const [perf, setPerf] = useState<PortfolioPerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ ticker: '', shares: '', avg_buy_price: '' });

  const load = () => {
    if (!token) return;
    portfolioApi.performance(portfolioId, token).then(setPerf).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [portfolioId, token]);

  const addHolding = async () => {
    if (!token || !form.ticker || !form.shares || !form.avg_buy_price) return;
    await portfolioApi.addHolding(portfolioId, form.ticker.toUpperCase(), parseFloat(form.shares), parseFloat(form.avg_buy_price), token);
    setForm({ ticker: '', shares: '', avg_buy_price: '' });
    setAdding(false);
    load();
  };

  const remove = async (holdingId: string) => {
    if (!token) return;
    await portfolioApi.deleteHolding(portfolioId, holdingId, token);
    load();
  };

  if (loading) return <div className="flex justify-center p-8"><Spinner /></div>;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      {/* Summary */}
      {perf && (
        <div className="grid grid-cols-3 gap-4 p-5 border-b border-gray-800">
          {[
            ['Total Value',   fmtCurrency(perf.totalValue)],
            ['Total Cost',    fmtCurrency(perf.totalCost)],
            ['Total P&L',     `${fmtCurrency(perf.totalGainLoss)} (${fmtPct((perf.totalGainLoss / perf.totalCost) * 100)})`],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-gray-400 text-xs mb-0.5">{label}</p>
              <p className={`font-semibold ${label === 'Total P&L' ? colorPct(perf.totalGainLoss) : 'text-white'}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-400 text-xs border-b border-gray-800">
            {['Ticker', 'Shares', 'Avg Buy', 'Current', 'Value', 'P&L', ''].map(h => (
              <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {perf?.holdings.map(h => (
            <tr key={h.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
              <td className="px-4 py-3 font-semibold text-white">{h.ticker}</td>
              <td className="px-4 py-3 text-gray-300">{fmt(h.shares, 4)}</td>
              <td className="px-4 py-3 text-gray-300">{fmtCurrency(h.avg_buy_price)}</td>
              <td className="px-4 py-3 text-gray-300">{fmtCurrency(h.currentPrice)}</td>
              <td className="px-4 py-3 text-white">{fmtCurrency(h.currentValue)}</td>
              <td className={`px-4 py-3 font-medium ${colorPct(h.gainLoss)}`}>
                {fmtCurrency(h.gainLoss)} ({fmtPct(h.gainLossPct)})
              </td>
              <td className="px-4 py-3">
                <button onClick={() => remove(h.id)} className="text-gray-600 hover:text-red-400 transition-colors">
                  <Trash2 size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Add holding */}
      <div className="p-4">
        {adding ? (
          <div className="flex gap-2">
            {[['Ticker', 'ticker'], ['Shares', 'shares'], ['Avg Price', 'avg_buy_price']].map(([ph, key]) => (
              <input key={key} placeholder={ph} value={(form as any)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-500" />
            ))}
            <button onClick={addHolding} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors">Add</button>
            <button onClick={() => setAdding(false)} className="px-4 py-2 bg-gray-700 text-gray-300 text-sm rounded-lg">Cancel</button>
          </div>
        ) : (
          <button onClick={() => setAdding(true)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
            <Plus size={16} /> Add holding
          </button>
        )}
      </div>
    </div>
  );
}
