'use client';
import { useState, useEffect } from 'react';
import { portfolioApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { PortfolioTable } from '@/components/Portfolio/PortfolioTable';
import { Spinner } from '@/components/UI/Spinner';
import { Plus } from 'lucide-react';
import type { Portfolio } from '@/lib/types';

export default function PortfolioPage() {
  const { token, user } = useAuth();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!token) return;
    portfolioApi.list(token).then(data => {
      setPortfolios(data);
      if (data.length) setSelected(data[0].id);
    }).finally(() => setLoading(false));
  }, [token]);

  const create = async () => {
    if (!token || !newName.trim()) return;
    const p = await portfolioApi.create(newName.trim(), token);
    setPortfolios(prev => [...prev, p]);
    setSelected(p.id);
    setNewName('');
    setCreating(false);
  };

  if (!user) return <p className="text-center text-gray-400 pt-20">Sign in to view your portfolio.</p>;
  if (loading) return <div className="flex justify-center pt-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Portfolio</h1>
        <button onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors">
          <Plus size={16} /> New Portfolio
        </button>
      </div>

      {creating && (
        <div className="flex gap-2">
          <input value={newName} onChange={e => setNewName(e.target.value)}
            placeholder="Portfolio name"
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-500" />
          <button onClick={create} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg">Create</button>
          <button onClick={() => setCreating(false)} className="px-4 py-2 bg-gray-700 text-gray-300 text-sm rounded-lg">Cancel</button>
        </div>
      )}

      {/* Portfolio tabs */}
      {portfolios.length > 0 && (
        <div className="flex gap-2 border-b border-gray-800 pb-2">
          {portfolios.map(p => (
            <button key={p.id} onClick={() => setSelected(p.id)}
              className={`px-4 py-1.5 rounded-lg text-sm transition-colors ${
                selected === p.id ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'
              }`}>
              {p.name}
            </button>
          ))}
        </div>
      )}

      {selected && <PortfolioTable portfolioId={selected} />}
      {!portfolios.length && !creating && (
        <p className="text-gray-400 text-center py-16">No portfolios yet. Create one above.</p>
      )}
    </div>
  );
}
