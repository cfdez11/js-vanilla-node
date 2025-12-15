import { getComponentHtmlDisk, saveComponentHtmlDisk } from "./files.js";

/**
 * Retrieves a cached HTML component from disk and checks if it is stale.
 *
 * @async
 * @param {Object} options
 * @param {string} options.componentPath - Unique identifier or path of the component/page to retrieve.
 * @param {number} [options.revalidateSeconds=0] - Number of seconds before the cached HTML is considered stale.
 * @returns {Promise<{ html: string|null, isStale?: boolean }>} 
 *          - `html`: The cached HTML content, or null if it does not exist.
 *          - `isStale`: True if the cached entry is older than `revalidateSeconds`.
 */
export async function getCachedComponentHtml({ componentPath, revalidateSeconds = 0 }) {
  return await getComponentHtmlDisk({ componentPath, revalidateSeconds });
}

/**
 * Stores HTML content of a component/page on disk for caching purposes.
 *
 * @async
 * @param {Object} options
 * @param {string} options.componentPath - Unique identifier or path of the component/page to cache.
 * @param {string} options.html - The HTML content to store in the cache.
 * @returns {Promise<void>} Resolves when the HTML and metadata have been successfully saved.
 */
export async function setCachedComponentHtml({ componentPath, html }) {
  await saveComponentHtmlDisk({ componentPath, html });
}
