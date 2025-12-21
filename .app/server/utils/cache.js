import { getComponentHtmlDisk, markComponentHtmlStale, saveComponentHtmlDisk } from "./files.js";

/**
 * Retrieves cached HTML for a component or page from disk and determines if it is stale.
 * 
 * This function supports Incremental Static Regeneration (ISR) semantics:
 * - If the cache does not exist, `html` will be null.
 * - If the cache exists, `isStale` indicates whether the cached HTML should be regenerated.
 *
 * @async
 * @param {Object} options
 * @param {string} options.componentPath - Unique identifier or path of the component/page to retrieve.
 * @param {number} [options.revalidateSeconds=0] - Number of seconds before the cached HTML is considered stale.
 *    - `-1` indicates the cache never becomes stale (always fresh).
 *    - `0` indicates the cache is always stale (regenerate on every request).
 * @returns {Promise<{ html: string|null, isStale: boolean }>} 
 *    - `html`: The cached HTML content, or null if not cached.
 *    - `isStale`: True if the cache is stale or explicitly invalidated, false otherwise.
 */
export async function getCachedComponentHtml({ componentPath, revalidateSeconds = 0 }) {
  const { html, meta } =  await getComponentHtmlDisk({ componentPath, revalidateSeconds });

  if (!html) {
    return { html: null };
  }

  let staleByTime = false;
  if (revalidateSeconds !== -1) {
    staleByTime = Date.now() - meta.generatedAt > revalidateSeconds * 1000;
  }

  const isStale = meta.isStale === true || staleByTime;

  return { html, isStale };
}

/**
 * Stores HTML content of a component/page on disk along with metadata.
 * 
 * Metadata includes:
 * - `generatedAt`: Timestamp of when the HTML was generated
 * - `isStale`: Indicates if the cache is stale (always false when saving)
 *
 * @async
 * @param {Object} options
 * @param {string} options.componentPath - Unique identifier or path of the component/page to cache.
 * @param {string} options.html - The HTML content to store in the cache.
 * @returns {Promise<void>} Resolves when the HTML and metadata have been successfully saved.
 */
export async function saveCachedComponentHtml({ componentPath, html }) {
  await saveComponentHtmlDisk({ componentPath, html });
}

/**
 * Marks a cached component as stale without regenerating it.
 * 
 * This is useful for manual revalidation or triggering ISR.
 *
 * @async
 * @param {string} componentPath - Unique identifier or path of the component/page to invalidate.
 * @returns {Promise<void>} Resolves when the cache metadata has been updated.
 */
export async function revalidateCachedComponentHtml(componentPath) {
  await markComponentHtmlStale({ componentPath });
}

/**
 * Converts a revalidation setting into seconds for ISR purposes.
 *
 * @param {number|boolean|string} revalidate - Revalidation setting.
 *   - If a number, it represents the number of seconds before the cache becomes stale.
 *   - If `true`, defaults to 60 seconds.
 *   - If `0`, cache is always stale.
 *   - If `false` or `"never"`, cache never becomes stale.
 * @returns {number} Number of seconds for revalidation, or -1 for no revalidation.
 */
export function getRevalidateSeconds(revalidate) {
  if (typeof revalidate === "number") {
    return revalidate;
  } if (typeof revalidate === "string" && !Number.isNaN(Number(revalidate))) {
    return Number(revalidate);
  }else if (revalidate === true) {
    return 60; // default to 60 seconds
  } else if (revalidate === 'never' || revalidate === false) {
    return -1; // never revalidate
  } else {
    return 0; // always revalidate
  } 
}