import { loadRouteComponent } from './cache.js';

    
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
     * @property {(marker: HTMLElement) => { render: (marker: string) => void, metadata: any}} [component]
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
      component: async () => {
        const mod = await loadRouteComponent("/not-found", () => import("../_components/_not_found_38fcb039.js"));
        
        return { hydrateClientComponent: mod.hydrateClientComponent, metadata: mod.metadata };
      },
      layouts: [{"name":"_layout_2c9170dc","importPath":"../_components/_layout_2c9170dc.js"}],
      meta: {
        ssr: false,
        requiresAuth: false,
      },
    },
{
      path: "/page-csr/:city",
      component: async () => {
        const mod = await loadRouteComponent("/page-csr/:city", () => import("../_components/_page_csr_city_3aa0994b.js"));
        
        return { hydrateClientComponent: mod.hydrateClientComponent, metadata: mod.metadata };
      },
      layouts: [{"name":"_layout_2c9170dc","importPath":"../_components/_layout_2c9170dc.js"}],
      meta: {
        ssr: false,
        requiresAuth: false,
      },
    },
{
      path: "/page-csr",
      component: async () => {
        const mod = await loadRouteComponent("/page-csr", () => import("../_components/_page_csr_f4051c9e.js"));
        
        return { hydrateClientComponent: mod.hydrateClientComponent, metadata: mod.metadata };
      },
      layouts: [{"name":"_layout_2c9170dc","importPath":"../_components/_layout_2c9170dc.js"}],
      meta: {
        ssr: false,
        requiresAuth: false,
      },
    },
{
        path: "/page-ssr/madrid",
        component: async () => {
          const mod = await loadRouteComponent("/page-ssr/madrid", () => import("../_components/_page_ssr_madrid_b406ec35.js"));

          return { hydrateClientComponent: mod.hydrateClientComponent, metadata: mod.metadata };
        },
        layouts: [{"name":"_layout_2c9170dc","importPath":"../_components/_layout_2c9170dc.js"}],
        meta: {
          ssr: false,
          requiresAuth: false,
        },
      },
{
        path: "/page-ssr/barcelona",
        component: async () => {
          const mod = await loadRouteComponent("/page-ssr/barcelona", () => import("../_components/_page_ssr_barcelona_b3ef923b.js"));

          return { hydrateClientComponent: mod.hydrateClientComponent, metadata: mod.metadata };
        },
        layouts: [{"name":"_layout_2c9170dc","importPath":"../_components/_layout_2c9170dc.js"}],
        meta: {
          ssr: false,
          requiresAuth: false,
        },
      },
{
        path: "/page-ssr/londres",
        component: async () => {
          const mod = await loadRouteComponent("/page-ssr/londres", () => import("../_components/_page_ssr_londres_05307de2.js"));

          return { hydrateClientComponent: mod.hydrateClientComponent, metadata: mod.metadata };
        },
        layouts: [{"name":"_layout_2c9170dc","importPath":"../_components/_layout_2c9170dc.js"}],
        meta: {
          ssr: false,
          requiresAuth: false,
        },
      },
{
        path: "/page-ssr/nuevayork",
        component: async () => {
          const mod = await loadRouteComponent("/page-ssr/nuevayork", () => import("../_components/_page_ssr_nuevayork_e2af5ed8.js"));

          return { hydrateClientComponent: mod.hydrateClientComponent, metadata: mod.metadata };
        },
        layouts: [{"name":"_layout_2c9170dc","importPath":"../_components/_layout_2c9170dc.js"}],
        meta: {
          ssr: false,
          requiresAuth: false,
        },
      },
{
        path: "/page-ssr/paris",
        component: async () => {
          const mod = await loadRouteComponent("/page-ssr/paris", () => import("../_components/_page_ssr_paris_71630b6e.js"));

          return { hydrateClientComponent: mod.hydrateClientComponent, metadata: mod.metadata };
        },
        layouts: [{"name":"_layout_2c9170dc","importPath":"../_components/_layout_2c9170dc.js"}],
        meta: {
          ssr: false,
          requiresAuth: false,
        },
      },
{
        path: "/page-ssr/tokio",
        component: async () => {
          const mod = await loadRouteComponent("/page-ssr/tokio", () => import("../_components/_page_ssr_tokio_c94d21bc.js"));

          return { hydrateClientComponent: mod.hydrateClientComponent, metadata: mod.metadata };
        },
        layouts: [{"name":"_layout_2c9170dc","importPath":"../_components/_layout_2c9170dc.js"}],
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
{
      path: "/",
      meta: {
        ssr: true,
        requiresAuth: false,
      },
    },
{
      path: "/static",
      component: async () => {
        const mod = await loadRouteComponent("/static", () => import("../_components/_static_de6e0f62.js"));
        
        return { hydrateClientComponent: mod.hydrateClientComponent, metadata: mod.metadata };
      },
      layouts: [{"name":"_layout_2c9170dc","importPath":"../_components/_layout_2c9170dc.js"},{"name":"_static_layout_b5e4107f","importPath":"../_components/_static_layout_b5e4107f.js"}],
      meta: {
        ssr: false,
        requiresAuth: false,
      },
    },
{
      path: "/static-with-data",
      component: async () => {
        const mod = await loadRouteComponent("/static-with-data", () => import("../_components/_static_with_data_a0acd4a0.js"));
        
        return { hydrateClientComponent: mod.hydrateClientComponent, metadata: mod.metadata };
      },
      layouts: [{"name":"_layout_2c9170dc","importPath":"../_components/_layout_2c9170dc.js"}],
      meta: {
        ssr: false,
        requiresAuth: false,
      },
    }
    ];