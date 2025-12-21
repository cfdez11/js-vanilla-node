/**
       * @typedef {Object} RouteMeta
       * @property {boolean} ssr
       * @property {boolean} requiresAuth
       * @property {number | string} revalidate
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
      ssr: true,
      requiresAuth: false,
      revalidate: "0" ,
    },
  },
{
    path: "/not-found",
    serverPath: "/not-found",
    isNotFound: true,
    meta: {
      ssr: false,
      requiresAuth: false,
      revalidate: "0" ,
    },
  },
{
    path: "/page-csr/[city]",
    serverPath: "/page-csr/:city",
    isNotFound: false,
    meta: {
      ssr: false,
      requiresAuth: false,
      revalidate: "0" ,
    },
  },
{
    path: "/page-csr",
    serverPath: "/page-csr",
    isNotFound: false,
    meta: {
      ssr: false,
      requiresAuth: false,
      revalidate: "0" ,
    },
  },
{
    path: "/page-ssr/[city]",
    serverPath: "/page-ssr/:city",
    isNotFound: false,
    meta: {
      ssr: false,
      requiresAuth: false,
      revalidate: "never" ,
    },
  },
{
    path: "/page-ssr",
    serverPath: "/page-ssr",
    isNotFound: false,
    meta: {
      ssr: true,
      requiresAuth: false,
      revalidate: "10" ,
    },
  },
{
    path: "/",
    serverPath: "/",
    isNotFound: false,
    meta: {
      ssr: true,
      requiresAuth: false,
      revalidate: "0" ,
    },
  },
{
    path: "/static",
    serverPath: "/static",
    isNotFound: false,
    meta: {
      ssr: false,
      requiresAuth: false,
      revalidate: "0" ,
    },
  },
{
    path: "/static-with-data",
    serverPath: "/static-with-data",
    isNotFound: false,
    meta: {
      ssr: false,
      requiresAuth: false,
      revalidate: "never" ,
    },
  }
      ];