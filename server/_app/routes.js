// Notes: In future, we can add this routes automatically when we build the project, getting the info from pages directory
export const routes = [
  {
    path: "/",
    serverPath: "/",
    meta: {
      ssr: true,
      requiresAuth: false,
    },
  },
  {
    path: "/page-csr",
    serverPath: "/page-csr",
    meta: {
      ssr: false,
      requiresAuth: false,
    },
  },
  {
    path: "/page-ssr",
    serverPath: "/page-ssr",
    meta: {
      ssr: true,
      requiresAuth: false,
    },
  },
  {
    path: "/page-ssr/[city]",
    serverPath: "/page-ssr/:city",
    meta: {
      ssr: true,
      requiresAuth: false,
    },
  },
  {
    path: "/page-csr/[city]",
    serverPath: "/page-csr/:city",
    meta: {
      ssr: false,
      requiresAuth: false,
    },
  },
];

export const notFoundRoute = {
  path: "/not-found",
  serverPath: "/not-found",
  meta: {
    ssr: true,
    requiresAuth: false,
  },
};

export const errorRoute = {
  path: "/error",
  serverPath: "/error",
  meta: {
    ssr: true,
    requiresAuth: false,
  },
};
