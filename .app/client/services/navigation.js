import { routes } from "./_routes.js";
import { prefetchRouteComponent } from "./cache.js";
import { createLayoutRenderer } from "./layouts.js";
import { updateRouteParams } from "./useRouteParams.js";

let currentNavigationController = null;
const layoutRenderer = createLayoutRenderer();

/**
 * Converts a route path with parameters (e.g., '/page/:city/:team') into a RegExp
 * and captures the parameter names.
 *
 * @param {string} routePath - The route path to convert
 * @returns {{regex: RegExp, keys: string[]}} The generated RegExp and parameter keys
 */
function pathToRegex(routePath) {
  const keys = [];
  const regex = new RegExp(
    "^" +
      routePath.replace(/:([^/]+)/g, (_, key) => {
        keys.push(key);
        return "([^/]+)";
      }) +
      "$"
  );
  return { regex, keys };
}

/**
 * Finds a route that matches the given path and extracts route parameters.
 * Always returns an object with `route` and `params`.
 *
 * @param {string} path - The URL path to match (e.g., '/page/madrid/barcelona')
 * @returns {MatchedRoute} An object containing the matched route and params
 */
function findRouteWithParams(path) {
  for (const r of routes) {
    if (typeof r.path === "string") {
      const { regex, keys } = pathToRegex(r.path);
      const match = path.match(regex);
      if (match) {
        const params = {};
        keys.forEach((key, i) => {
          params[key] = match[i + 1];
        });
        return { route: r, params };
      }
    } else if (r.path instanceof RegExp) {
      if (r.path.test(path)) {
        return { route: r, params: {} };
      }
    }
  }

  return { route: null, params: {} };
}

/**
 * Sets up an IntersectionObserver to prefetch route components
 * for links marked with `data-prefetch` when they enter the viewport.
 */
function setupPrefetchObserver() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const link = entry.target;
        if (!link.hasAttribute("data-prefetch")) return;

        const url = new URL(link.href, window.location.origin);

        const route = routes.find((r) => r.path === url.pathname);

        if (!route?.component) return;

        prefetchRouteComponent(route.path, route.component);
        observer.unobserve(link);
      });
    },
    { rootMargin: "200px" }
  );

  document.querySelectorAll("a[data-prefetch]").forEach((link) => {
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
  window.addEventListener("popstate", () => {
    navigate(location.pathname, false);
  });

  setupPrefetchObserver();
  setupLinkInterceptor();
  layoutRenderer.reset();

  // Perform initial navigation if is not SSR
  const { route } = findRouteWithParams(location.pathname);
  if (route?.meta?.ssr) return;

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
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a");
    if (!link) return;

    const href = link.getAttribute("href");

    if (!href || href.startsWith("#")) return;

    const url = new URL(href, window.location.origin);
    const isExternal = url.origin !== window.location.origin;
    const forceReload = link.dataset.reload !== undefined;

    if (
      isExternal ||
      forceReload ||
      link.target === "_blank" ||
      link.rel === "external"
    ) {
      return;
    }

    event.preventDefault();
    navigate(url.pathname);
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
      descriptionMeta = document.createElement("meta");
      descriptionMeta.name = "description";
      document.head.appendChild(descriptionMeta);
    }

    descriptionMeta.content = metadata.description;
  }
}

/**
 * Renders a route component into the main container.
 *
 * @param {import('./_routes.js').Route} route - The route object.
 * @param {string} path - The route path.
 * @returns {Promise<void>}
 */
export async function renderPage(route, path) {
  if (!route?.component) return;
  const pageModule = await route.component();

  if (!pageModule.hydrateClientComponent) return;

  const appRootElement = document.getElementById("app-root") || document.body;
  if (!appRootElement) return;

  // generate page HTML
  const pageMarker = document.createElement("template");
  const pageNode = pageModule.hydrateClientComponent(pageMarker);

  const { node, layoutId, metadata } = await layoutRenderer.generate({
    routeLayouts: route.layouts,
    pageNode,
    metadata: pageModule.metadata,
  });

  // update DOM

  if (layoutId) {
    layoutRenderer.patch(layoutId, node);
  } else {
    appRootElement.innerHTML = "";
    appRootElement.appendChild(node);
  }

  if (metadata) {
    addMetadata(metadata);
  }

  hydrateComponents(); // global function from hydrate-client-components.js
}

/**
 * Navigates to a given path using SPA behavior for CSR routes.
 * Performs history push and renders the page component.
 *
 * Updates route params store on navigation.
 *
 * Control of ongoing navigations with AbortController
 * @param {string} path - The target route path.
 * @param {boolean} [addToHistory=true] - Whether to push to history stack.
 */
export async function navigate(path, addToHistory = true) {
  // abort previous SSR fetch
  if (currentNavigationController) {
    currentNavigationController.abort();
  }

  const controller = new AbortController();
  currentNavigationController = controller;

  updateRouteParams(path);

  const routePath = path.split("?")[0];
  const { route } = findRouteWithParams(routePath);

  if (addToHistory) {
    history.pushState({}, "", path);
  }

  try {
    if (route?.meta?.ssr) {
      await renderSSRPage(path, controller.signal);
      return;
    }

    if (route?.meta?.requiresAuth && !app.Store?.loggedIn) {
      navigate("/account/login");
      return;
    }

    if (route?.meta?.accessOnly && app.Store?.loggedIn) {
      navigate("/account");
      return;
    }

    renderPage(route, routePath);
  } catch (e) {
    if (e.name === "AbortError") {
      console.log("Navigation aborted due to route change");
      return;
    }
    console.error("Navigation error:", e);
  } finally {
    if (currentNavigationController === controller) {
      currentNavigationController = null;
    }
  }
}

/**
 * Fetches an SSR page via streaming and progressively updates the DOM.
 * @async
 * @param {string} path - The URL/path of the SSR page to fetch.
 * @param {AbortSignal} signal - The AbortSignal to cancel the fetch if needed.
 * @throws {Error} If the response body is not readable or the <main> element is missing.
 */
async function renderSSRPage(path, signal) {
  // clean up layoutsRendered for next CSR navigation
  layoutRenderer.reset();

  const response = await fetch(path, { signal });
  if (!response.body) throw new Error("Invalid response body");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let htmlBuffer = "";

  const mainEl = document.querySelector("main");
  if (!mainEl) throw new Error("<main> element not found");

  const parser = new DOMParser();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    htmlBuffer += decoder.decode(value, { stream: true });

    htmlBuffer = processSSRMain(htmlBuffer, parser, mainEl);
    htmlBuffer = processSSRTemplates(htmlBuffer, parser);
    htmlBuffer = processSSRScripts(htmlBuffer, parser);
    updateSSRMetadata(htmlBuffer, parser);
    hydrateComponents(); // global function from hydrate-client-components.js
  }
}

/**
 * Processes a <main> element from the buffer and updates the DOM.
 * @param {string} buffer - Current HTML buffer.
 * @param {DOMParser} parser - DOMParser instance.
 * @param {HTMLElement} mainEl - The <main> element to update.
 * @returns {string} Remaining HTML buffer after processing.
 */
function processSSRMain(buffer, parser, mainEl) {
  const mainMatch = buffer.match(/<main[\s\S]*?<\/main>/i);
  if (mainMatch) {
    const mainDoc = parser.parseFromString(mainMatch[0], "text/html");
    const newMain = mainDoc.querySelector("main");

    if (newMain) {
      mainEl.innerHTML = newMain.innerHTML;
    }

    return buffer.slice(mainMatch.index + mainMatch[0].length);
  }

  return buffer;
}

/**
 * Processes <template> elements from the buffer and injects into the DOM.
 * @param {string} buffer - Current HTML buffer.
 * @param {DOMParser} parser - DOMParser instance.
 * @returns {string} Remaining HTML buffer after processing.
 */
function processSSRTemplates(buffer, parser) {
  const templateRegex = /<template[\s\S]*?<\/template>/gi;
  let match;
  while ((match = templateRegex.exec(buffer)) !== null) {
    const tempDoc = parser
      .parseFromString(match[0], "text/html")
      .querySelector("template");
    if (tempDoc && !document.getElementById(tempDoc.id)) {
      document.body.appendChild(tempDoc.cloneNode(true));
    }
  }
  const closeTemplateTag = "</template>";
  const lastIndex = buffer.lastIndexOf(closeTemplateTag);
  if (lastIndex !== -1) {
    return buffer.slice(lastIndex + closeTemplateTag.length);
  }
  return buffer;
}

/**
 * Processes <script> elements from the buffer, executes inline scripts, and injects external scripts.
 * @param {string} buffer - Current HTML buffer.
 * @param {DOMParser} parser - DOMParser instance.
 * @returns {string} Remaining HTML buffer after processing.
 */
function processSSRScripts(buffer, parser) {
  const scriptRegex = /<script[\s\S]*?<\/script>/gi;
  let match;
  while ((match = scriptRegex.exec(buffer)) !== null) {
    const scriptEl = parser
      .parseFromString(match[0], "text/html")
      .querySelector("script");
    if (!scriptEl) continue;

    // Hydration scripts for Suspense
    if (scriptEl.dataset.target && scriptEl.dataset.source) {
      const targetId = scriptEl.dataset.target;
      const sourceId = scriptEl.dataset.source;
      const existScript = document.querySelector(
        `script[data-target="${targetId}"][data-source="${sourceId}"]`
      );

      if (!existScript) {
        const newScript = document.createElement("script");
        Object.keys(scriptEl.dataset).forEach(
          (k) => (newScript.dataset[k] = scriptEl.dataset[k])
        );
        newScript.src = scriptEl.src;
        newScript.async = true;
        const templateEl = document.getElementById(sourceId);
        if (templateEl) {
          templateEl.after(newScript);
        } else {
          document.body.appendChild(newScript);
        }
      }
    }
    // External scripts
    else if (scriptEl.src) {
      const srcPath = new URL(scriptEl.src, window.location.origin).pathname;
      if (
        !Array.from(document.scripts).some(
          (s) => new URL(s.src, window.location.origin).pathname === srcPath
        )
      ) {
        const newScript = document.createElement("script");
        newScript.src = scriptEl.src;
        newScript.async = true;
        document.head.appendChild(newScript);
      }
    }
    // Inline scripts
    else {
      try {
        new Function(scriptEl.textContent)();
      } catch (e) {
        console.error("Error executing inline script:", e);
      }
    }
  }

  const lastIndex = buffer.lastIndexOf("</script>");
  if (lastIndex !== -1) return buffer.slice(lastIndex + 9);
  return buffer;
}

/**
 * Updates document <title> and <meta name="description"> if present in the buffer.
 * @param {string} buffer - Current HTML buffer.
 * @param {DOMParser} parser - DOMParser instance.
 */
function updateSSRMetadata(buffer, parser) {
  const tempDoc = parser.parseFromString(buffer, "text/html");

  const titleEl = tempDoc.querySelector("title");
  if (titleEl) {
    document.title = titleEl.textContent;
  }

  const metaDesc = tempDoc.querySelector('meta[name="description"]');
  if (metaDesc) {
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    meta.content = metaDesc.content;
  }
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
  const out = {};
  const qs = new URLSearchParams(search);

  for (const [k, v] of qs.entries()) {
    out[k] = v;
  }

  return out;
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
  const qs = new URLSearchParams();

  for (const k in raw) {
    if (raw[k] != null) {
      qs.set(k, String(raw[k]));
    }
  }

  return qs.toString();
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
  const { schema = {}, replace = false, listen = true } = options;

  /**
   * Compute default values by executing schema parsers
   * with an undefined input.
   */
  const defaults = {};
  for (const key in schema) {
    defaults[key] = schema[key](undefined);
  }

  /**
   * Raw query params as strings.
   * This mirrors exactly what exists in the URL.
   */
  let raw = parseRawQuery(window.location.search);

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
    const parsed = {};

    // Apply schema parsing and defaults
    for (const key in schema) {
      const parser = schema[key];
      parsed[key] = parser(raw[key]);
    }

    // Preserve non-declared query params
    for (const key in raw) {
      if (!(key in parsed)) {
        parsed[key] = raw[key];
      }
    }

    return parsed;
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
    const out = {};

    for (const key in next) {
      const value = next[key];

      if (Array.isArray(value)) {
        out[key] = value.join(",");
      } else if (value != null) {
        out[key] = String(value);
      }
    }

    return out;
  }

  /**
   * Synchronizes the internal raw state with the browser URL.
   *
   * @param {Object.<string, string>} nextRaw
   */
  function sync(nextRaw) {
    raw = nextRaw;

    const qs = buildQueryString(raw);
    const url =
      window.location.pathname + (qs ? `?${qs}` : "") + window.location.hash;

    history[replace ? "replaceState" : "pushState"](null, "", url);
  }

  /**
   * Updates one or more query params.
   *
   * Values are serialized and merged with existing params.
   *
   * @param {Object} next
   */
  function set(next) {
    const serialized = serializeWithSchema(next);
    sync({ ...raw, ...serialized });
  }

  /**
   * Removes one or more query params.
   *
   * @param {...string} keys
   */
  function remove(...keys) {
    const next = { ...raw };
    keys.forEach((k) => delete next[k]);
    sync(next);
  }

  /**
   * Removes all query params from the URL.
   */
  function reset() {
    sync({});
  }

  /**
   * Keeps internal state in sync with browser
   * back/forward navigation.
   */
  if (listen) {
    window.addEventListener("popstate", () => {
      raw = parseRawQuery(window.location.search);
    });
  }

  return {
    /**
     * Parsed query params.
     *
     * This is a getter, so values are always derived
     * from the current raw URL state.
     */
    get params() {
      return parseWithSchema(raw);
    },

    /**
     * Raw query params as strings.
     * Exposed mainly for debugging or tooling.
     */
    get raw() {
      return { ...raw };
    },

    set,
    remove,
    reset,
  };
}
