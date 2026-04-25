import fetch from 'node-fetch';
import Parser from 'rss-parser';
import { withCache } from './redis.js';

const TTL = 15 * 60;
const rss = new Parser();

export async function fetchNewsAPI(ticker) {
  return withCache(`news:api:${ticker}`, TTL, async () => {
    const url = `https://newsapi.org/v2/everything?q=${ticker}&sortBy=publishedAt&pageSize=10&apiKey=${process.env.NEWS_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    return (data.articles || []).map((a) => ({
      title: a.title,
      url: a.url,
      publishedAt: a.publishedAt,
      source: a.source.name,
    }));
  });
}

const RSS_FEEDS = [
  'https://feeds.finance.yahoo.com/rss/2.0/headline?s={ticker}&region=US&lang=en-US',
  'https://www.marketwatch.com/rss/topstories',
];

export async function fetchRSSNews(ticker) {
  return withCache(`news:rss:${ticker}`, TTL, async () => {
    const url = RSS_FEEDS[0].replace('{ticker}', ticker);
    const feed = await rss.parseURL(url);
    return feed.items.slice(0, 10).map((i) => ({
      title: i.title,
      url: i.link,
      publishedAt: i.pubDate,
      source: 'Yahoo Finance RSS',
    }));
  });
}

export async function getNews(ticker) {
  const [api, rssItems] = await Promise.allSettled([
    fetchNewsAPI(ticker),
    fetchRSSNews(ticker),
  ]);
  return [
    ...(api.status === 'fulfilled' ? api.value : []),
    ...(rssItems.status === 'fulfilled' ? rssItems.value : []),
  ].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
}
