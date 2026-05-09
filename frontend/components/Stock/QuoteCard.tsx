import type { Quote } from '@/lib/types';
import { fmtCurrency, fmtBillions, fmtPct, colorPct, fmt } from '@/lib/utils';
import { Badge } from '@/components/UI/Badge';

export function QuoteCard({ quote }: { quote: Quote }) {
  const change = quote.regularMarketChangePercent;
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-gray-400 text-sm">{quote.symbol}</p>
          <p className="text-white font-semibold text-lg truncate">{quote.shortName}</p>
        </div>
        <Badge label={change >= 0 ? 'Bullish' : 'Bearish'} variant={change >= 0 ? 'green' : 'red'} />
      </div>
      <p className="text-3xl font-bold text-white mb-1">{fmtCurrency(quote.regularMarketPrice)}</p>
      <p className={`text-sm font-medium mb-4 ${colorPct(change)}`}>
        {fmtPct(change)} today
      </p>
      <div className="grid grid-cols-2 gap-3 text-sm">
        {[
          ['Market Cap', fmtBillions(quote.marketCap)],
          ['P/E Ratio',  fmt(quote.trailingPE)],
          ['52W High',   fmtCurrency(quote.fiftyTwoWeekHigh)],
          ['52W Low',    fmtCurrency(quote.fiftyTwoWeekLow)],
        ].map(([label, value]) => (
          <div key={label} className="bg-gray-800 rounded-lg p-2.5">
            <p className="text-gray-400 text-xs mb-0.5">{label}</p>
            <p className="text-white font-medium">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
