'use client';
import { useParams } from 'next/navigation';
import { useQuote, useHistory, useNews } from '@/hooks/useStock';
import { QuoteCard } from '@/components/Stock/QuoteCard';
import { PriceChart } from '@/components/Stock/PriceChart';
import { NewsFeed } from '@/components/Stock/NewsFeed';
import { Spinner } from '@/components/UI/Spinner';

export default function StockPage() {
  const { ticker } = useParams<{ ticker: string }>();
  const t = ticker.toUpperCase();
  const { data: quote, loading: qLoading } = useQuote(t);
  const { data: history, loading: hLoading } = useHistory(t);
  const { articles, sentiment, loading: nLoading } = useNews(t);

  if (qLoading) return <div className="flex justify-center pt-20"><Spinner size="lg" /></div>;
  if (!quote) return <p className="text-gray-400 text-center pt-20">Ticker not found.</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">{quote.shortName} ({t})</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <QuoteCard quote={quote} />
        </div>
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Price History (1Y)</h3>
          {hLoading ? <div className="flex justify-center py-10"><Spinner /></div>
            : <PriceChart data={history} height={260} />}
        </div>
      </div>
      {!nLoading && (
        <NewsFeed articles={articles} sentiment={sentiment} />
      )}
    </div>
  );
}
