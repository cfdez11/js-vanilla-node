import * as _not_found_38fcb039 from "./_components/_not_found_38fcb039.js";
import * as _page_csr_city_3aa0994b from "./_components/_page_csr_city_3aa0994b.js";
import * as _page_csr_f4051c9e from "./_components/_page_csr_f4051c9e.js";
import * as _static_de6e0f62 from "./_components/_static_de6e0f62.js";
import * as _static_with_data_a0acd4a0 from "./_components/_static_with_data_a0acd4a0.js";

    
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
      path: "/not-found",
      component: _not_found_38fcb039.hydrateClientComponent,
      meta: {
        ssr: false,
        requiresAuth: false,
        ...(_not_found_38fcb039.metadata || {}),
      },
    },
{
      path: "/page-csr/:city",
      component: _page_csr_city_3aa0994b.hydrateClientComponent,
      meta: {
        ssr: false,
        requiresAuth: false,
        ...(_page_csr_city_3aa0994b.metadata || {}),
      },
    },
{
      path: "/page-csr",
      component: _page_csr_f4051c9e.hydrateClientComponent,
      meta: {
        ssr: false,
        requiresAuth: false,
        ...(_page_csr_f4051c9e.metadata || {}),
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
      meta: {
        ssr: true,
        requiresAuth: false,
      },
    },
{
      path: "/static",
      component: _static_de6e0f62.hydrateClientComponent,
      meta: {
        ssr: false,
        requiresAuth: false,
        ...(_static_de6e0f62.metadata || {}),
      },
    },
{
      path: "/static-with-data",
      component: _static_with_data_a0acd4a0.hydrateClientComponent,
      meta: {
        ssr: false,
        requiresAuth: false,
        ...(_static_with_data_a0acd4a0.metadata || {}),
      },
    }
    ];