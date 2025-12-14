
  /**
   * @typedef {Object} RouteMeta
   * @property {boolean} ssr - Indicates if the page is server-side rendered (SSR)
   * @property {boolean} requiresAuth - Indicates if the page requires authentication
   * @property {number} revalidateSeconds - Time in seconds for ISR revalidation
   */

  /**
   * @typedef {Object} Route
   * @property {string} path - Public route used by the router (e.g., "/page/[city]")
   * @property {string} serverPath - Server route used for matching (e.g., "/page/:city")
   * @property {boolean} isNotFound - Indicates if this route corresponds to the 404 page
   * @property {RouteMeta} meta - Metadata for the route
   */

  /**
   * List of application routes.
   * Each object defines the public path, server path, whether it is a 404 route, and metadata.
   *
   * @type {Route[]}
   */
  
export const routes = [
  {
    "path": "/error",
    "serverPath": "/error",
    "isNotFound": false,
    "meta": {
      "ssr": true,
      "requiresAuth": false,
      "revalidateSeconds": 0
    }
  },
  {
    "path": "/not-found",
    "serverPath": "/not-found",
    "isNotFound": true,
    "meta": {
      "ssr": false,
      "requiresAuth": false,
      "revalidateSeconds": 0
    }
  },
  {
    "path": "/page-csr/[city]",
    "serverPath": "/page-csr/:city",
    "isNotFound": false,
    "meta": {
      "ssr": false,
      "requiresAuth": false,
      "revalidateSeconds": 0
    }
  },
  {
    "path": "/page-csr",
    "serverPath": "/page-csr",
    "isNotFound": false,
    "meta": {
      "ssr": false,
      "requiresAuth": false,
      "revalidateSeconds": 0
    }
  },
  {
    "path": "/page-ssr/[city]",
    "serverPath": "/page-ssr/:city",
    "isNotFound": false,
    "meta": {
      "ssr": true,
      "requiresAuth": false,
      "revalidateSeconds": 60
    }
  },
  {
    "path": "/page-ssr",
    "serverPath": "/page-ssr",
    "isNotFound": false,
    "meta": {
      "ssr": true,
      "requiresAuth": false,
      "revalidateSeconds": 0
    }
  },
  {
    "path": "/",
    "serverPath": "/",
    "isNotFound": false,
    "meta": {
      "ssr": true,
      "requiresAuth": false,
      "revalidateSeconds": 0
    }
  }
];
    