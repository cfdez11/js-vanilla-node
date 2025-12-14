
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
    "path": "/pages/error/page.html",
    "serverPath": "/pages/error/page.html",
    "component": null,
    "meta": {
      "ssr": true,
      "requiresAuth": false,
      "revalidateSeconds": 0,
      "extrameta": null
    }
  },
  {
    "path": "/pages/not-found/page.html",
    "serverPath": "/pages/not-found/page.html",
    "component": null,
    "meta": {
      "ssr": false,
      "requiresAuth": false,
      "revalidateSeconds": 0,
      "extrameta": null
    }
  },
  {
    "path": "/pages/page-csr/[city]/page.html",
    "serverPath": "/pages/page-csr/[city]/page.html",
    "component": null,
    "meta": {
      "ssr": false,
      "requiresAuth": false,
      "revalidateSeconds": 0,
      "extrameta": null
    }
  },
  {
    "path": "/pages/page-csr/page.html",
    "serverPath": "/pages/page-csr/page.html",
    "component": null,
    "meta": {
      "ssr": false,
      "requiresAuth": false,
      "revalidateSeconds": 0,
      "extrameta": null
    }
  },
  {
    "path": "/pages/page-ssr/[city]/page.html",
    "serverPath": "/pages/page-ssr/[city]/page.html",
    "component": null,
    "meta": {
      "ssr": true,
      "requiresAuth": false,
      "revalidateSeconds": 60,
      "extrameta": null
    }
  },
  {
    "path": "/pages/page-ssr/page.html",
    "serverPath": "/pages/page-ssr/page.html",
    "component": null,
    "meta": {
      "ssr": true,
      "requiresAuth": false,
      "revalidateSeconds": 0,
      "extrameta": null
    }
  },
  {
    "path": "/pages/page.html",
    "serverPath": "/pages/page.html",
    "component": null,
    "meta": {
      "ssr": true,
      "requiresAuth": false,
      "revalidateSeconds": 0,
      "extrameta": null
    }
  }
];