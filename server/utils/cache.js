/**
 * In-memory cache store for HTML components.
 * 
 * Key: componentPath (string)
 * Value: {
 *   html: string,        // The rendered HTML of the component
 *   generatedAt: number  // Timestamp (in ms) when the cache was generated
 * }
 * 
 * @type {Map<string, { html: string, generatedAt: number }>}
 */
const store = new Map();

/**
 * Represents a cached component entry.
 * @typedef {Object} CacheEntry
 * @property {string} html - The HTML content of the component.
 * @property {number} generatedAt - Timestamp (in ms) when the cache was created.
 */

/**
 * Retrieves a cached HTML component if it exists and checks if it is stale.
 *
 * @param {Object} options
 * @param {string} options.componentPath - Unique identifier or path of the component to retrieve.
 * @param {number} [options.revalidateSeconds=0] - Number of seconds before the cache is considered stale.
 * @returns {{ html: string|null, isStale?: boolean }} 
 *          - `html`: The cached HTML, or null if not cached.
 *          - `isStale`: True if the cached entry is older than `revalidateSeconds`.
 */

export function getCachedComponentHtml({ componentPath, revalidateSeconds = 0 }) {
  const entry = store.get(componentPath);

  if (!entry) {
    return { html: null };
  }

  const isStale =
    Date.now() - entry.generatedAt > revalidateSeconds * 1000;

  return { html: entry.html, isStale };
}

/**
 * Stores HTML content in the cache for a specific component path.
 *
 * @param {Object} options
 * @param {string} options.componentPath - Unique identifier or path of the component to cache.
 * @param {string} options.html - The HTML content to cache.
 * @returns {void}
 */
export function setCachedComponentHtml({ componentPath, html }) {
  store.set(componentPath, {
    html,
    generatedAt: Date.now()
  });
}
