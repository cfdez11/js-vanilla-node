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
