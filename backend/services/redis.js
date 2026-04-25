import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export async function withCache(key, ttl, fetcher) {
  const cached = await redis.get(key);
  if (cached) return cached;
  const data = await fetcher();
  await redis.set(key, data, { ex: ttl });
  return data;
}
