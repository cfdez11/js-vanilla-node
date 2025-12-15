import { routes } from '../_routes.js';


function findRoute(path) {
  return routes.find((r) => {
    if (typeof r.path === "string") return r.path === path;
    if (r.path instanceof RegExp) return path.match(r.path);
    return false;
  });
}

function handleClickLink(event, link) {
  const href = link.getAttribute("href");
  const routePath = href.split("?")[0];
  const route = findRoute(routePath);

  if (window.location.pathname === routePath) {
    event.preventDefault();
    return;
  }

  // Client side navigation - SPA
  if (route && !route.meta?.ssr) {
    event.preventDefault();
    navigate(href);
  }
}

/**
 * Must be initialized inside a DOMContentLoaded event listener
 */
function initializeRouter() {
  window.addEventListener("popstate", () => {
    navigate(location.pathname, false);
  });

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a");
    if (link) {
      handleClickLink(event, link);
    }
  });

  navigate(location.pathname, false);
}

/**
 * Adds hydrate-client-components script to the document head
 * @returns {void}
 */
function addHydrateClientComponentScript() {
  if (document.querySelector('script[src="/public/_app/services/hydrate-client-components.js"]')) {
    return;
  }

  const hydrateScript = document.createElement("script");
  hydrateScript.src = "/public/_app/services/hydrate-client-components.js";
  document.head.appendChild(hydrateScript);
}

const addMetadata = (metadata) => {
  if (metadata.title) {
    document.title = metadata.title;
  }
  if (metadata.description) {
    let descriptionMeta = document.querySelector('meta[name="description"]');
    if (!descriptionMeta) {
      descriptionMeta = document.createElement("meta");
      descriptionMeta.name = "description";
      document.head.appendChild(descriptionMeta);
    }
    descriptionMeta.content = metadata.description;
  }
}

/**
 * 
 * @param {{
 * path: string,
 * meta: { ssr: boolean, requiresAuth: false, [key: string]: any }
 * }} route 
 * @param {string} path 
 * @returns {void}
 */
function renderPage(route, path) {
  const main = document.querySelector("main");

  if (!route || !route.component) {
    return;
  }

  // Get regex matches for dynamic routes
  let params = [];
  if (route.path instanceof RegExp) {
    const match = path.match(route.path);
    params = match ? match.slice(1) : [];
  }

  // create template marker
  main.innerHTML = "";
  const marker = document.createElement("template");
  main.appendChild(marker);

  // render component into marker
  route.component(marker);

  if (route.metadata) {
    addMetadata(route.meta);
  }

  addHydrateClientComponentScript();
}

/**
 * Redirect user a new page page by path, with optional history addition
 * @param {string} path 
 * @param {boolean} addToHistory 
 * @returns {void}
 */
function navigate(path, addToHistory = true) {
  const routePath = path.split("?")[0];
  const route = findRoute(routePath);

  // Skip SSR routes
  if (route?.meta?.ssr) return;

  if (addToHistory) {
    history.pushState({}, "", path);
  }

  // Auth checks
  if (route?.meta?.requiresAuth && !app.Store?.loggedIn) {
    navigate("/account/login");
    return;
  }

  if (route?.meta?.accessOnly && app.Store?.loggedIn) {
    navigate("/account");
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
function useQueryParams(options = {}) {
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
}


export { initializeRouter, renderPage, navigate, useQueryParams };
