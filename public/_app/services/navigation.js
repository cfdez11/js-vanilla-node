import { routes } from '../_routes.js';
import { prefetchRouteComponent } from './cache.js';

/**
 * Finds a route configuration matching a given path.
 *
 * Supports both static string paths and RegExp paths.
 *
 * @param {string} path - The path to match against the route definitions.
 * @returns {Object|undefined} The matched route object, or undefined if no match.
 */
function findRoute(path) {
  return routes.find((r) => {
    if (typeof r.path === 'string') return r.path === path;
    if (r.path instanceof RegExp) return r.path.test(path);
    return false;
  });
}

/**
 * Sets up an IntersectionObserver to prefetch route components
 * for links marked with `data-prefetch` when they enter the viewport.
 */
function setupPrefetchObserver() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const link = entry.target;
      if (!link.hasAttribute('data-prefetch')) return;

      const url = new URL(link.href, window.location.origin);

      const route = routes.find(r => r.path === url.pathname);

      if (!route?.component) return;

      prefetchRouteComponent(route.path, route.component);
      observer.unobserve(link);
    });
  }, { rootMargin: '200px' });

  document.querySelectorAll('a[data-prefetch]').forEach((link) => {
    if (!link.__prefetchObserved) {
      link.__prefetchObserved = true;
      observer.observe(link);
    }
  });
}

/**
 * Initializes the SPA router, including:
 * - Popstate listener for back/forward navigation
 * - Link interception for client-side routing
 * - Prefetch observer setup
 *
 * Must be called after DOMContentLoaded.
 */
export function initializeRouter() {
  window.addEventListener('popstate', () => {
    navigate(location.pathname, false);
  });

  setupPrefetchObserver();
  setupLinkInterceptor();

  // Perform initial navigation
  navigate(location.pathname, false);
}

/**
 * Sets up click interception on internal links to perform SPA navigation
 * instead of full page reloads.
 *
 * Links with `data-reload`, `_blank`, `rel="external"` or external URLs
 * are ignored.
 */
function setupLinkInterceptor() {
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    
    if (!href || href.startsWith('#')) return;

    const url = new URL(href, window.location.origin);
    const isExternal = url.origin !== window.location.origin;
    const forceReload = link.dataset.reload !== undefined;

    if (
      isExternal ||
      forceReload ||
      link.target === '_blank' ||
      link.rel === 'external'
    ) {
      return;
    }

    const routePath = url.pathname;
    const route = findRoute(routePath);

    if (route?.meta?.ssr) return;

    event.preventDefault();
    navigate(url.pathname + url.search + url.hash);
  });
}

/**
 * Injects route metadata (title, description) into the document head.
 *
 * @param {Object} metadata - The route metadata.
 * @param {string} [metadata.title] - Page title to set.
 * @param {string} [metadata.description] - Page description meta tag.
 */

function addMetadata(metadata) {
  if (metadata.title) {
    document.title = metadata.title;
  }

  if (metadata.description) {
    let descriptionMeta = document.querySelector('meta[name="description"]');

    if (!descriptionMeta) {
      descriptionMeta = document.createElement('meta');
      descriptionMeta.name = 'description';
      document.head.appendChild(descriptionMeta);
    }

    descriptionMeta.content = metadata.description;
  }
}

/**
 * Ensures the client hydration script is injected into the head,
 * avoiding duplicate script insertion.
 */
function addHydrateClientComponentScript() {
  if (
    document.querySelector(
      'script[src="/public/_app/services/hydrate-client-components.js"]'
    )
  ) {
    return;
  }

  const script = document.createElement('script');
  script.src = '/public/_app/services/hydrate-client-components.js';
  script.type = 'module';
  document.head.appendChild(script);
}

/**
 * Renders a route component into the main container.
 *
 * @param {Object} route - The route object.
 * @param {string} path - The route path.
 * @returns {Promise<void>}
 */
export async function renderPage(route, path) {
  if (!route?.component) return;

  const { hydrateClientComponent, metadata } = await route.component();

  if(!hydrateClientComponent) return;

  const main = document.querySelector('main');
  if (!main) return;

  main.innerHTML = '';

  const marker = document.createElement('template');
  main.appendChild(marker);

  hydrateClientComponent(marker);
  
  if (metadata) {
    addMetadata(metadata);
  }

  addHydrateClientComponentScript();
}

/**
 * Navigates to a given path using SPA behavior for CSR routes.
 * Performs history push and renders the page component.
 *
 * @param {string} path - The target route path.
 * @param {boolean} [addToHistory=true] - Whether to push to history stack.
 */
export async function navigate(path, addToHistory = true) {
  const routePath = path.split('?')[0];
  const route = findRoute(routePath);

  if (route?.meta?.ssr) {
    // todo: to avoid clear all scripts cache, fetch the html and replace only <main> content and metadata
    return;
  };

  if (addToHistory) {
    history.pushState({}, '', path);
  }

  if (route?.meta?.requiresAuth && !app.Store?.loggedIn) {
    navigate('/account/login');
    return;
  }

  if (route?.meta?.accessOnly && app.Store?.loggedIn) {
    navigate('/account');
    return;
  }

  renderPage(route, routePath);
}

/**
 * Parses the URL search string into a plain object.
 *
 * This function represents the **raw URL state**:
 * - Keys and values are always strings
 * - No defaults are applied
 * - No parsing or validation is performed
 *
 * Example:
 *   "?page=2&tags=js,spa" → { page: "2", tags: "js,spa" }
 *
 * @param {string} search - window.location.search
 * @returns {Object.<string, string>}
 */
function parseRawQuery(search) {
  const out = {}
  const qs = new URLSearchParams(search)

  for (const [k, v] of qs.entries()) {
    out[k] = v
  }

  return out
}

/**
 * Builds a query string from a raw params object.
 *
 * - Values are stringified
 * - `null` and `undefined` values are omitted
 *
 * Example:
 *   { page: "2", tags: "js,spa" } → "page=2&tags=js,spa"
 *
 * @param {Object.<string, any>} raw
 * @returns {string} Query string without leading "?"
 */
function buildQueryString(raw) {
  const qs = new URLSearchParams()

  for (const k in raw) {
    if (raw[k] != null) {
      qs.set(k, String(raw[k]))
    }
  }

  return qs.toString()
}


/**
 * Manages URL query parameters as application state.
 *
 * This hook provides:
 * - Parsing via schema (similar to nuqs)
 * - Default values
 * - URL synchronization (push / replace)
 * - Back/forward navigation support
 *
 * The URL remains the single source of truth.
 *
 * @param {Object} options
 * @param {Object.<string, Function>} [options.schema]
 *   Map of query param parsers.
 *   Each function receives the raw string value (or undefined)
 *   and must return a parsed value with a default fallback.
 *
 * @param {boolean} [options.replace=false]
 *   If true, uses history.replaceState instead of pushState.
 *
 * @param {boolean} [options.listen=true]
 *   If true, listens to popstate events to keep state in sync.
 *
 * @returns {Object}
 */
export function useQueryParams(options = {}) {
  const {
    schema = {},
    replace = false,
    listen = true
  } = options

  /**
   * Compute default values by executing schema parsers
   * with an undefined input.
   */
  const defaults = {}
  for (const key in schema) {
    defaults[key] = schema[key](undefined)
  }

  /**
   * Raw query params as strings.
   * This mirrors exactly what exists in the URL.
   */
  let raw = parseRawQuery(window.location.search)

  /**
   * Parses raw query params using the provided schema.
   *
   * - Schema keys are always present (defaults applied)
   * - Unknown params are passed through as strings
   *
   * @param {Object.<string, string>} raw
   * @returns {Object} Parsed params ready for application use
   */
  function parseWithSchema(raw) {
    const parsed = {}

    // Apply schema parsing and defaults
    for (const key in schema) {
      const parser = schema[key]
      parsed[key] = parser(raw[key])
    }

    // Preserve non-declared query params
    for (const key in raw) {
      if (!(key in parsed)) {
        parsed[key] = raw[key]
      }
    }

    return parsed
  }

  /**
   * Serializes application-level values into
   * raw URL-safe string values.
   *
   * - Arrays are joined by comma
   * - null / undefined values are omitted
   *
   * @param {Object} next
   * @returns {Object.<string, string>}
   */
  function serializeWithSchema(next) {
    const out = {}

    for (const key in next) {
      const value = next[key]

      if (Array.isArray(value)) {
        out[key] = value.join(',')
      } else if (value != null) {
        out[key] = String(value)
      }
    }

    return out
  }

  /**
   * Synchronizes the internal raw state with the browser URL.
   *
   * @param {Object.<string, string>} nextRaw
   */
  function sync(nextRaw) {
    raw = nextRaw

    const qs = buildQueryString(raw)
    const url =
      window.location.pathname +
      (qs ? `?${qs}` : '') +
      window.location.hash

    history[replace ? 'replaceState' : 'pushState'](null, '', url)
  }

  /**
   * Updates one or more query params.
   *
   * Values are serialized and merged with existing params.
   *
   * @param {Object} next
   */
  function set(next) {
    const serialized = serializeWithSchema(next)
    sync({ ...raw, ...serialized })
  }

  /**
   * Removes one or more query params.
   *
   * @param {...string} keys
   */
  function remove(...keys) {
    const next = { ...raw }
    keys.forEach(k => delete next[k])
    sync(next)
  }

  /**
   * Removes all query params from the URL.
   */
  function reset() {
    sync({})
  }

  /**
   * Keeps internal state in sync with browser
   * back/forward navigation.
   */
  if (listen) {
    window.addEventListener('popstate', () => {
      raw = parseRawQuery(window.location.search)
    })
  }

  return {
    /**
     * Parsed query params.
     *
     * This is a getter, so values are always derived
     * from the current raw URL state.
     */
    get params() {
      return parseWithSchema(raw)
    },

    /**
     * Raw query params as strings.
     * Exposed mainly for debugging or tooling.
     */
    get raw() {
      return { ...raw }
    },

    set,
    remove,
    reset
  }
}

/**
 * Extracts dynamic route parameters from the current path.
 * 
 * This function matches the current URL against a set of predefined routes
 * that may contain dynamic segments indicated by the `:paramName` syntax.
 * It supports multiple dynamic parameters in a single route.
 *
 * @param {string} [currentPath=window.location.pathname] - The current URL path to parse.
 * @returns {Object} An object containing the key-value pairs of route parameters.
 *
 * Example:
 *  Routes: [{ path: '/users/:userId/:postId' }]
 *  Path: '/users/1/53'
 *  Returns: { userId: '1', postId: '53' }
 */
export function useRouteParams(currentPath = window.location.pathname) {
  try {
const pathParts = currentPath.split('/').filter(Boolean);

  for (const route of routes) {
    const routeParts = route.path.split('/').filter(Boolean);

    // Skip routes with a different number of segments
    if (routeParts.length !== pathParts.length) continue;

    const params = {};
    let isMatch = true;

    for (let i = 0; i < routeParts.length; i++) {
      const routePart = routeParts[i];
      const pathPart = pathParts[i];

      if (routePart.startsWith(':')) {
        // Extract parameter name and assign corresponding value from path
        const paramName = routePart.slice(1);
        params[paramName] = pathPart;
      } else if (routePart !== pathPart) {
        // If a static segment does not match, this route is not a match
        isMatch = false;
        break;
      }
    }

    // If a matching route is found, return the extracted parameters
    if (isMatch) return params;
  }

  // Return an empty object if no matching route is found
  return {};
  } catch(e) {
    console.error("useRouteParams error:", e);
    return {};
  }
}
