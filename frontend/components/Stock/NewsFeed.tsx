import type { NewsArticle, Sentiment } from '@/lib/types';
import { Badge } from '@/components/UI/Badge';

function sentimentVariant(s: Sentiment) {
  if (s.label === 'bullish') return 'green';
  if (s.label === 'bearish') return 'red';
  return 'yellow';
}

export function NewsFeed({ articles, sentiment }: { articles: NewsArticle[]; sentiment: Sentiment | null }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">News & Sentiment</h3>
        {sentiment && (
          <Badge
            label={`${sentiment.label} (${sentiment.score > 0 ? '+' : ''}${sentiment.score.toFixed(2)})`}
            variant={sentimentVariant(sentiment)}
          />
        )}
      </div>
      <div className="space-y-3">
        {articles.slice(0, 8).map((a, i) => (
          <a key={i} href={a.url} target="_blank" rel="noopener noreferrer"
            className="block group">
            <p className="text-gray-300 text-sm group-hover:text-blue-400 transition-colors line-clamp-2">
              {a.title}
            </p>
            <p className="text-gray-500 text-xs mt-0.5">
              {a.source} · {new Date(a.publishedAt).toLocaleDateString()}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}
