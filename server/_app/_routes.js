/**
       * @typedef {Object} RouteMeta
       * @property {boolean} ssr
       * @property {boolean} requiresAuth
       * @property {number} revalidateSeconds
       */
  
      /**
       * @typedef {Object} Route
       * @property {string} path
       * @property {string} serverPath
       * @property {boolean} isNotFound
       * @property {RouteMeta} meta
       */
    
      export const routes = [
        {
    path: "/error",
    serverPath: "/error",
    isNotFound: false,
    meta: {
      ssr: "true",
      requiresAuth: false,
      revalidateSeconds: undefined ?? 0,
    },
  },
{
    path: "/not-found",
    serverPath: "/not-found",
    isNotFound: true,
    meta: {
      ssr: "false",
      requiresAuth: false,
      revalidateSeconds: undefined ?? 0,
    },
  },
{
    path: "/page-csr/[city]",
    serverPath: "/page-csr/:city",
    isNotFound: false,
    meta: {
      ssr: "false",
      requiresAuth: false,
      revalidateSeconds: undefined ?? 0,
    },
  },
{
    path: "/page-csr",
    serverPath: "/page-csr",
    isNotFound: false,
    meta: {
      ssr: "false",
      requiresAuth: false,
      revalidateSeconds: undefined ?? 0,
    },
  },
{
    path: "/page-ssr/[city]",
    serverPath: "/page-ssr/:city",
    isNotFound: false,
    meta: {
      ssr: "true",
      requiresAuth: false,
      revalidateSeconds: 10 ?? 0,
    },
  },
{
    path: "/page-ssr",
    serverPath: "/page-ssr",
    isNotFound: false,
    meta: {
      ssr: "true",
      requiresAuth: false,
      revalidateSeconds: 10 ?? 0,
    },
  },
{
    path: "/",
    serverPath: "/",
    isNotFound: false,
    meta: {
      ssr: "true",
      requiresAuth: false,
      revalidateSeconds: undefined ?? 0,
    },
  }
      ];