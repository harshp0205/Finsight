'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { TrendingUp, LogOut } from 'lucide-react';

const NAV = [
  { href: '/',           label: 'Chat' },
  { href: '/portfolio',  label: 'Portfolio' },
  { href: '/watchlist',  label: 'Watchlist' },
  { href: '/compare',    label: 'Compare' },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, loading, signInWithGoogle, signOut } = useAuth();

  return (
    <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-white">
            <TrendingUp size={20} className="text-blue-400" />
            FinSight
          </Link>
          <div className="flex items-center gap-1">
            {NAV.map(({ href, label }) => (
              <Link key={href} href={href}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  pathname === href
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}>
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          {loading ? null : user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400">{user.email}</span>
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
