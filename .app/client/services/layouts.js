/**
 * Creates a layout renderer responsible for dynamically loading,
 * rendering, caching, and patching route-based layouts.
 *
 * The renderer keeps track of already rendered layouts to avoid
 * unnecessary re-renders and supports incremental layout updates.
 *
 * @returns {{
 *   generate: (params: {
 *     routeLayouts?: Array<{ name: string, importPath: string }>,
 *     pageNode: Node,
 *     metadata: any
 *   }) => Promise<{
 *     layoutId: string | null,
 *     node: Node,
 *     metadata: any
 *   }>,
 *   patch: (layoutId: string, node: Node) => void,
 *   reset: () => void
 * }}
 */
export function createLayoutRenderer() {
  /**
   * Cache of rendered layouts indexed by layout name.
   *
   * Each record stores the rendered DOM node and its children
   * placeholder to allow efficient patching.
   *
   * @type {Map<string, {
   *   name: string,
   *   children: Node,
   *   node: Node
   * }>}
   */
  const renderedLayouts = new Map();

  /**
   * Removes cached layouts that are no longer part of the current route.
   *
   * @param {Array<{ name: string, importPath: string }>} routeLayouts
   */
  function cleanNotNeeded(routeLayouts) {
    for (const name of renderedLayouts.keys()) {
      const exists = routeLayouts.some((l) => l.name === name);
      if (!exists) {
        renderedLayouts.delete(name);
      }
    }
  }

  /**
   * Finds the nearest already-rendered layout in the route hierarchy.
   *
   * The search starts from the deepest layout and walks upward
   * until a cached layout is found.
   *
   * @param {Array<{ name: string, importPath: string }>} routeLayouts
   * @returns {{
   *   name: string,
   *   children: Node,
   *   node: Node
   * } | null}
   */
  function getNearestRendered(routeLayouts) {
    const reversed = routeLayouts.toReversed();

    for (const layout of reversed) {
      if (renderedLayouts.has(layout.name)) {
        return renderedLayouts.get(layout.name);
      }
    }

    return null;
  }

  /**
   * Determines which layouts need to be rendered based on
   * the nearest cached layout.
   *
   * Layouts above the nearest rendered one are skipped.
   *
   * @param {Array<{ name: string, importPath: string }>} routeLayouts
   * @param {{
   *   name: string,
   *   children: Node,
   *   node: Node
   * } | null} nearestRendered
   * @returns {Array<{ name: string, importPath: string }>}
   */
  function getLayoutsToRender(routeLayouts, nearestRendered) {
    if (!nearestRendered) return routeLayouts;

    const reversed = routeLayouts.toReversed();
    const idx = reversed.findIndex((l) => l.name === nearestRendered.name);

    return idx === -1 ? routeLayouts : reversed.slice(0, idx);
  }

  /**
   * Dynamically imports layout modules.
   *
   * @param {Array<{ name: string, importPath: string }>} layouts
   * @returns {Promise<Array<any>>}
   */
  async function loadLayoutModules(layouts) {
    return Promise.all(layouts.map((layout) => import(layout.importPath)));
  }

  /**
   * Generates the layout tree wrapping the provided page node.
   *
   * Layouts are rendered from outermost to innermost and cached
   * for future navigations.
   *
   * @param {{
   *   routeLayouts?: Array<{ name: string, importPath: string }>,
   *   pageNode: Node,
   *   metadata: any
   * }} params
   * @returns {Promise<{
   *   layoutId: string | null,
   *   node: Node,
   *   metadata: any
   * }>}
   */
  async function generate({ routeLayouts = [], pageNode, metadata }) {
    if (!pageNode || routeLayouts.length === 0) {
      return {
        layoutId: null,
        html: pageNode,
        metadata,
      };
    }

    cleanNotNeeded(routeLayouts);

    const nearestRendered = getNearestRendered(routeLayouts);
    const layoutsToRender = getLayoutsToRender(routeLayouts, nearestRendered);

    const modules = await loadLayoutModules(layoutsToRender);

    let htmlContainerNode = pageNode;
    let deepestMetadata = metadata;

    for (let i = modules.length - 1; i >= 0; i--) {
      const layout = layoutsToRender[i];
      const mod = modules[i];

      const children = htmlContainerNode;
      const marker = document.createElement("template");

      htmlContainerNode = mod.hydrateClientComponent(marker, { children });

      if (!deepestMetadata && mod.metadata) {
        deepestMetadata = mod.metadata;
      }

      renderedLayouts.set(layout.name, {
        name: layout.name,
        children,
        node: htmlContainerNode,
      });
    }

    return {
      layoutId: nearestRendered?.name ?? null,
      node: htmlContainerNode,
      metadata: deepestMetadata,
    };
  }

  /**
   * Patches an already-rendered layout by replacing its children node.
   *
   * This is typically used for client-side navigations where
   * only part of the layout tree needs updating.
   *
   * @param {string} layoutId
   * @param {Node} node
   */
  function patch(layoutId, node) {
    const record = renderedLayouts.get(layoutId);
    if (!record) return;

    record.children.replaceWith(node);
    record.children = node;
  }

  /**
   * Clears all cached rendered layouts.
   *
   * Intended to be used during full resets or hard navigations.
   */
  function reset() {
    renderedLayouts.clear();
  }

  return {
    generate,
    patch,
    reset,
  };
}
