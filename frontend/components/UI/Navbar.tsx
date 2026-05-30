'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { TrendingUp, LogOut, Search } from 'lucide-react';
import { useState } from 'react';

const NAV = [
  { href: '/',           label: 'Chat' },
  { href: '/markets',    label: 'Markets' },
  { href: '/portfolio',  label: 'Portfolio' },
  { href: '/watchlist',  label: 'Watchlist' },
  { href: '/compare',    label: 'Compare' },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signInWithGoogle, signOut } = useAuth();
  const [search, setSearch] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const t = search.trim();
    if (t) { router.push(`/stock/${t}`); setSearch(''); }
  };

  return (
    <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-shrink-0">
          <Link href="/" className="flex items-center gap-2 font-bold text-white">
            <TrendingUp size={20} className="text-blue-400" />
            FinSight
          </Link>
          <div className="flex items-center gap-1">
            {NAV.map(({ href, label }) => (
              <Link key={href} href={href}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  pathname === href || (href !== '/' && pathname.startsWith(href))
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}>
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xs">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value.toUpperCase())}
              placeholder="Search ticker… (AAPL, TCS, Reliance)"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-3 py-1.5 text-white text-sm outline-none focus:border-blue-500 placeholder:text-gray-500"
            />
          </div>
        </form>

        <div className="flex-shrink-0">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400 hidden sm:block">{user.email}</span>
              <button onClick={signOut} className="text-gray-400 hover:text-white transition-colors">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button onClick={signInWithGoogle}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors">
              Sign in
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
