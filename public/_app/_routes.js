import * as _page_csr__city from "./_components/_page_csr__city.js";
import * as _page_csr from "./_components/_page_csr.js";
import * as _ from "./_components/_.js";

    
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
     * @property {(marker: HTMLElement) => void} [component]
     * @property {RouteMeta} meta
     */
  
    export const routes = [
      {
      path: "/error",
      meta: {
        ssr: true,
        requiresAuth: false,
      },
    },
{
      path: "/page-csr/:city",
      component: _page_csr__city.hydrateClientComponent,
      meta: {
        ssr: false,
        requiresAuth: false,
        ...(_page_csr__city.metadata || {}),
      },
    },
{
      path: "/page-csr",
      component: _page_csr.hydrateClientComponent,
      meta: {
        ssr: false,
        requiresAuth: false,
        ...(_page_csr.metadata || {}),
      },
    },
{
      path: "/page-ssr/:city",
      meta: {
        ssr: true,
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
{
      path: "/",
      component: _.hydrateClientComponent,
      meta: {
        ssr: false,
        requiresAuth: false,
        ...(_.metadata || {}),
      },
    }
    ];