import * as pageCSR from "../components/page-csr.js";

// Notes: In future, we can add this routes automatically when we build the project, getting the info from pages directory
export const routes = [
  {
    path: "/",
    meta: {
      ssr: true,
      requiresAuth: false,
    },
  },
  {
    path: "/page-csr",
    component: pageCSR.hydrateClientComponent,
    metadata: pageCSR.metadata,
    meta: {
      ssr: false,
      requiresAuth: false,
    },
  },
  {
    path: "/page-ssr",
    meta: {
      ssr: true,
      requiresAuth: false,
    },
  },
  // {
  //   path: /\/movies\/(\d+)/,
  //   component: MovieDetailsPage,
  // },
  // {
  //   path: "/account",
  //   component: AccountPage,
  //   type: "private",
  // },
  // {
  //   path: "/account/register",
  //   component: RegisterPage,
  //   type: "access",
  // },
  // {
  //   path: "/account/login",
  //   component: LoginPage,
  //   type: "access",
  // },
  // {
  //   path: "/account/favorites",
  //   component: FavoritesPage,
  //   type: "private",
  // },
  // {
  //   path: "/account/watchlist",
  //   component: WatchlistPage,
  //   type: "private",
  // },
];

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
 * meta: { ssr: boolean, requiresAuth: false }
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
    addMetadata(route.metadata);
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

export { initializeRouter, renderPage, navigate };
