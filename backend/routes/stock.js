import { Router } from 'express';
import { cacheMiddleware } from '../middleware/cache.js';
import { getQuote, getFinancials, getHistory, getEarnings } from '../services/yahoo.js';
import { getFilings } from '../services/edgar.js';
import { getNews } from '../services/news.js';
import { scoreSentiment } from '../services/sentiment.js';

const router = Router();

router.get('/:ticker', cacheMiddleware(60), async (req, res, next) => {
  try {
    const { ticker } = req.params;
    const quote = await getQuote(ticker.toUpperCase());
    res.sendCached(quote);
  } catch (err) { next(err); }
});

router.get('/:ticker/financials', cacheMiddleware(3600), async (req, res, next) => {
  try {
    const data = await getFinancials(req.params.ticker.toUpperCase());
    res.sendCached(data);
  } catch (err) { next(err); }
});

router.get('/:ticker/history', cacheMiddleware(3600), async (req, res, next) => {
  try {
    const data = await getHistory(req.params.ticker.toUpperCase(), req.query.period);
    res.sendCached(data);
  } catch (err) { next(err); }
});

router.get('/:ticker/earnings', cacheMiddleware(3600), async (req, res, next) => {
  try {
    const data = await getEarnings(req.params.ticker.toUpperCase());
    res.sendCached(data);
  } catch (err) { next(err); }
});

router.get('/:ticker/filings', cacheMiddleware(86400), async (req, res, next) => {
  try {
    const data = await getFilings(req.params.ticker.toUpperCase(), req.query.form || '10-K');
    res.sendCached(data);
  } catch (err) { next(err); }
});

router.get('/:ticker/news', cacheMiddleware(900), async (req, res, next) => {
  try {
    const ticker = req.params.ticker.toUpperCase();
    const articles = await getNews(ticker);
    const sentiment = await scoreSentiment(articles.slice(0, 10).map((a) => a.title));
    res.sendCached({ articles, sentiment });
  } catch (err) { next(err); }
});

export default router;
