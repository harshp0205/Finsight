import { redis } from '../services/redis.js';

export function cacheMiddleware(ttlSeconds) {
  return async (req, res, next) => {
    const key = `cache:${req.originalUrl}`;
    const cached = await redis.get(key);
    if (cached) return res.json(cached);

    res.sendCached = async (data) => {
      await redis.set(key, data, { ex: ttlSeconds });
      res.json(data);
    };
    next();
  };
}
