import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { supabase } from '../services/supabase.js';
import { getQuote } from '../services/yahoo.js';
import { resolveTicker } from '../utils/resolveTicker.js';

const router = Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('portfolios')
      .select('*, holdings(*)')
      .eq('user_id', req.user.sub);
    if (error) throw new Error(error.message);
    res.json(data || []);
  } catch (err) { next(err); }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { name } = req.body;
    console.log('[portfolio] creating for user_id:', req.user.sub);
    const { data, error } = await supabase
      .from('portfolios')
      .insert({ user_id: req.user.sub, name })
      .select()
      .single();
    if (error) throw new Error(error.message);
    res.status(201).json(data);
  } catch (err) { next(err); }
});

router.post('/:id/holdings', requireAuth, async (req, res, next) => {
  try {
    const { ticker: rawTicker, shares, avg_buy_price } = req.body;
    const ticker = resolveTicker(rawTicker);
    const { data, error } = await supabase
      .from('holdings')
      .insert({ portfolio_id: req.params.id, ticker, shares, avg_buy_price })
      .select()
      .single();
    if (error) throw new Error(error.message);
    res.status(201).json(data);
  } catch (err) { next(err); }
});

router.get('/:id/performance', requireAuth, async (req, res, next) => {
  try {
    const { data: holdings } = await supabase
      .from('holdings')
      .select('*')
      .eq('portfolio_id', req.params.id);

    const withPrices = await Promise.all(
      holdings.map(async (h) => {
        const quote = await getQuote(h.ticker);
        const currentValue = quote.regularMarketPrice * h.shares;
        const costBasis = h.avg_buy_price * h.shares;
        return {
          ...h,
          currentPrice: quote.regularMarketPrice,
          currentValue,
          costBasis,
          gainLoss: currentValue - costBasis,
          gainLossPct: ((currentValue - costBasis) / costBasis) * 100,
        };
      })
    );

    const totalValue = withPrices.reduce((s, h) => s + h.currentValue, 0);
    const totalCost = withPrices.reduce((s, h) => s + h.costBasis, 0);
    res.json({ holdings: withPrices, totalValue, totalCost, totalGainLoss: totalValue - totalCost });
  } catch (err) { next(err); }
});

router.delete('/:portfolioId/holdings/:holdingId', requireAuth, async (req, res, next) => {
  try {
    await supabase.from('holdings').delete().eq('id', req.params.holdingId);
    res.status(204).end();
  } catch (err) { next(err); }
});

export default router;
