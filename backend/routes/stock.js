import { Router } from 'express';
import { cacheMiddleware } from '../middleware/cache.js';
import { getQuote, getFinancials, getHistory, getEarnings } from '../services/yahoo.js';
import { getFilings } from '../services/edgar.js';
import { getNews } from '../services/news.js';
import { scoreSentiment } from '../services/sentiment.js';
import { resolveTicker } from '../utils/resolveTicker.js';

const router = Router();

router.get('/:ticker', cacheMiddleware(60), async (req, res, next) => {
  try {
    const ticker = resolveTicker(req.params.ticker);
    const quote = await getQuote(ticker);
    res.sendCached(quote);
  } catch (err) { next(err); }
});

router.get('/:ticker/financials', cacheMiddleware(3600), async (req, res, next) => {
  try {
    const data = await getFinancials(resolveTicker(req.params.ticker));
    res.sendCached(data);
  } catch (err) { next(err); }
});

router.get('/:ticker/history', cacheMiddleware(3600), async (req, res, next) => {
  try {
    const data = await getHistory(resolveTicker(req.params.ticker), req.query.period);
    res.sendCached(data);
  } catch (err) { next(err); }
});

router.get('/:ticker/earnings', cacheMiddleware(3600), async (req, res, next) => {
  try {
    const data = await getEarnings(resolveTicker(req.params.ticker));
    res.sendCached(data);
  } catch (err) { next(err); }
});

router.get('/:ticker/filings', cacheMiddleware(86400), async (req, res, next) => {
  try {
    const data = await getFilings(resolveTicker(req.params.ticker), req.query.form || '10-K');
    res.sendCached(data);
  } catch (err) { next(err); }
});

router.get('/:ticker/news', cacheMiddleware(900), async (req, res, next) => {
  try {
    const ticker = resolveTicker(req.params.ticker);
    const articles = await getNews(ticker);
    const sentiment = await scoreSentiment(articles.slice(0, 10).map((a) => a.title));
    res.sendCached({ articles, sentiment });
  } catch (err) { next(err); }
});

export default router;
