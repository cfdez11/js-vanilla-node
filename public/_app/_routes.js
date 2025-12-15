
    

    
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
      }
    ];
  