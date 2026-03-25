/**
 * In-process TTL cache for server-side data fetching.
 *
 * ISR pages regenerate periodically and call `getData` on every regeneration.
 * If multiple pages or multiple Suspense components call the same external API
 * (e.g. a weather API, a CMS), each regeneration fires N duplicate HTTP requests
 * even though the data is the same for all of them.
 *
 * `withCache(key, ttlSeconds, fn)` deduplicates these calls:
 *   - On the first call for a given key it invokes `fn`, caches the result,
 *     and returns it.
 *   - Subsequent calls within the TTL window return the cached value directly,
 *     with no I/O.
 *   - After the TTL expires the next call re-fetches and refreshes the cache.
 *
 * Usage inside a `<script server>` getData function:
 *
 *   async function getData({ req }) {
 *     const weather = await withCache('weather:london', 60, () =>
 *       fetch('https://api.example.com/weather?city=london').then(r => r.json())
 *     );
 *     return { weather };
 *   }
 *
 * `withCache` is automatically available in every server script — no import needed.
 *
 * Key:   any string that uniquely identifies the data source + parameters
 * TTL:   seconds the cached value is considered fresh
 * fn:    zero-argument function that returns a value or a Promise<value>
 */

/** @type {Map<string, { value: any, expiresAt: number }>} */
const cache = new Map();

/**
 * Returns a cached value for `key` if still fresh, otherwise calls `fn`,
 * stores the result, and returns it.
 *
 * @template T
 * @param {string} key       - Unique cache key.
 * @param {number} ttlSeconds - Seconds before the cached value expires.
 * @param {() => T | Promise<T>} fn - Fetcher called on a cache miss.
 * @returns {T | Promise<T>}
 */
export function withCache(key, ttlSeconds, fn) {
  const entry = cache.get(key);
  if (entry && Date.now() < entry.expiresAt) {
    return entry.value;
  }

  const result = fn();

  if (result instanceof Promise) {
    return result.then((value) => {
      cache.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
      return value;
    });
  }

  cache.set(key, { value: result, expiresAt: Date.now() + ttlSeconds * 1000 });
  return result;
}
