import path from "path";
import { SRC_DIR } from "./files.js";

/**
 * Creates the VexJS esbuild alias plugin.
 *
 * esbuild resolves imports by looking at the specifier string (e.g. "vex/reactive",
 * "./utils/counter", "lodash"). By default it only understands relative paths and
 * node_modules. This plugin teaches esbuild about the three VexJS-specific import
 * conventions so it can correctly bundle every <script client> block.
 *
 * The plugin intercepts imports at bundle time via onResolve hooks — each hook
 * matches a filter regex against the import specifier and returns either:
 *   - { path, external: true }  → esbuild leaves the import as-is in the output.
 *                                  The browser resolves it at runtime from the URL.
 *   - { path }                  → esbuild reads and inlines the file into the bundle.
 *
 * ─── Three categories of imports ────────────────────────────────────────────
 *
 * 1. Framework singletons  (vex/* and .app/*)
 *    Examples: `import { reactive } from 'vex/reactive'`
 *              `import { html } from '.app/html'`
 *
 *    These are framework runtime files served statically at /_vexjs/services/.
 *    They MUST be marked external so every component shares the same instance
 *    at runtime. If esbuild inlined them, each component bundle would get its
 *    own copy of reactive.js — reactive state would not be shared across
 *    components on the same page and the entire reactivity system would break.
 *
 *    The path is rewritten from the short alias to the browser-accessible URL:
 *      vex/reactive  →  /_vexjs/services/reactive.js  (external)
 *
 * 2. Project alias  (@/*)
 *    Example: `import { counter } from '@/utils/counter'`
 *
 *    @/ is a shorthand for the project SRC_DIR root. These are user JS utilities
 *    that should be bundled into the component (not served separately). esbuild
 *    receives the absolute filesystem path so it can read and inline the file.
 *
 * 3. Relative imports  (./ and ../)
 *    Example: `import { fn } from './helpers'`
 *
 *    These are resolved automatically by esbuild using the `resolveDir` option
 *    set on the stdin entry (the directory of the .vex file being compiled).
 *    No custom hook is needed for these.
 *
 * 4. npm packages  (bare specifiers like 'lodash', 'date-fns')
 *    Also resolved automatically by esbuild via node_modules lookup.
 *    No custom hook is needed.
 *
 * @returns {import('esbuild').Plugin}
 */
export function createVexAliasPlugin() {
  return {
    name: "vex-aliases",
    setup(build) {
      // ── Category 1a: vex/* ────────────────────────────────────────────────
      // Matches: 'vex/reactive', 'vex/html', 'vex/navigation', etc.
      // Rewrites to the browser URL and marks external so esbuild skips bundling.
      build.onResolve({ filter: /^vex\// }, (args) => {
        let mod = args.path.replace(/^vex\//, "");
        if (!path.extname(mod)) mod += ".js";
        return { path: `/_vexjs/services/${mod}`, external: true };
      });

      // ── Category 1b: .app/* ───────────────────────────────────────────────
      // Legacy alias for framework services. Same treatment as vex/*.
      // Matches: '.app/reactive', '.app/html', etc.
      build.onResolve({ filter: /^\.app\// }, (args) => {
        let mod = args.path.replace(/^\.app\//, "");
        if (!path.extname(mod)) mod += ".js";
        return { path: `/_vexjs/services/${mod}`, external: true };
      });

      // ── Category 2: @/ project alias ─────────────────────────────────────
      // Matches: '@/utils/counter', '@/lib/api', etc.
      // Resolved to an absolute filesystem path so esbuild can read and bundle
      // the file inline. No .js extension auto-appended here — esbuild does it.
      build.onResolve({ filter: /^@\// }, (args) => {
        let resolved = path.resolve(SRC_DIR, args.path.slice(2));
        if (!path.extname(resolved)) resolved += ".js";
        return { path: resolved };
      });
    },
  };
}
