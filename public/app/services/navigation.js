import { MeteoPage } from "../../components/MeteoPage.js";

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
    path: "/meteo-csr",
    component: MeteoPage,
    meta: {
      ssr: false,
      requiresAuth: false,
    },
  },
  {
    path: "/meteo-ssr",
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

export const Router = {
  currentRoute: null,

  init() {
    window.addEventListener("popstate", () => {
      this.go(location.pathname, false);
    });

    document.addEventListener("click", (event) => {
      const link = event.target.closest("a");
      if (link) {
        this.handleClickLink(event, link);
      }
    });

    this.go(location.pathname, false);
  },

  findRoute(path) {
    return routes.find((r) => {
      if (typeof r.path === "string") return r.path === path;
      if (r.path instanceof RegExp) return path.match(r.path);
      return false;
    });
  },

  handleClickLink(event, link) {
    const href = link.getAttribute("href");
    const routePath = href.split("?")[0];
    const route = this.findRoute(routePath);

    if (window.location.pathname === routePath) {
      event.preventDefault();
      return;
    }

    // Client side navigation - SPA
    if (route && !route.meta?.ssr) {
      event.preventDefault();
      this.go(href);
    }
  },

  go(path, addToHistory = true) {
    const routePath = path.split("?")[0];
    const route = this.findRoute(routePath);

    // Skip SSR routes
    if (route?.meta?.ssr) return;

    if (addToHistory) {
      history.pushState({}, "", path);
    }

    // Auth checks
    if (route?.meta?.requiresAuth && !app.Store?.loggedIn) {
      this.go("/account/login");
      return;
    }

    if (route?.meta?.accessOnly && app.Store?.loggedIn) {
      this.go("/account");
      return;
    }

    this.render(route, routePath);
  },

  render(route, path) {
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

    const pageElement = new route.component(...params);

    main.innerHTML = "";
    main.appendChild(pageElement);

    this.currentRoute = route;
  },
};
