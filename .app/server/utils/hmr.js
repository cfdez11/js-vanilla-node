/**
 * HMR (Hot Module Replacement) event bus for dev mode (FEAT-03).
 *
 * When a `.html` file changes in dev:
 *   1. The file watcher in `component-processor.js` invalidates the in-memory
 *      caches (processHtmlFileCache, parsedTemplateCache, etc.) and re-generates
 *      the client bundle for that file, then calls `hmrEmitter.emit('reload')`.
 *   2. The SSE endpoint in `index.js` listens on `hmrEmitter` and forwards the
 *      event to all connected browsers.
 *   3. The HMR client script in the browser receives the event and triggers a
 *      full-page reload so the user sees the updated page immediately.
 *
 * Using a single shared EventEmitter avoids coupling the file watcher
 * (component-processor.js) directly to the HTTP server (index.js).
 *
 * This module is a no-op in production — nothing imports it there.
 */

import { EventEmitter } from "events";

export const hmrEmitter = new EventEmitter();
