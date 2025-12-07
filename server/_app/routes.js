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
];

export const notFoundRoute = {
  path: "/not-found",
  meta: {
    ssr: true,
    requiresAuth: false,
  },
};

export const errorRoute = {
  path: "/error",
  meta: {
    ssr: true,
    requiresAuth: false,
  },
};
