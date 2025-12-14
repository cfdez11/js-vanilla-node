import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import { compileTemplateToHTML } from "./utils/template.js";
import { renderHtmlFile } from "./utils/component-processor.js";
import {
  renderComponents,
  renderSuspenseComponent,
  generateReplacementContent,
} from "./utils/streaming.js";
import { getCachedComponentHtml, setCachedComponentHtml } from "./utils/cache.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PAGES_DIR = path.resolve(__dirname, "..", "pages");

const DEFAULT_METADATA = {
  title: "Vanilla JS App",
  description: "Default description",
};

const FALLBACK_ERROR_HTML = `
  <!DOCTYPE html>
  <html>
  <head><title>Error 500</title></head>
  <body>
    <h1>Error 500 - Internal Server Error</h1>
    <p>An unexpected error has occurred.</p>
    <p><a href="/">Back to home</a></p>
  </body>
  </html>
`;

/**
 * Builds the path to a page file
 * @param {string} pageName
 * @returns {string}
 */
const getPagePath = (pageName) =>
  path.resolve(PAGES_DIR, pageName, "page.html");

/**
 * Retrieves layout HTML string
 * @returns {Promise<string>}
 */
const getLayoutTemplate = async () => {
  const layoutPath = path.resolve(PAGES_DIR, "layout.html");
  return await fs.readFile(layoutPath, "utf-8");
};

/**
 * Generates client script tag
 * @param {{
 * clientCode: string,
 * clientComponentsScripts: Array<string>,
 * clientComponents: 
 *  Map<string, {
 *    path: string,
 *    originalPath: string,
 *    importStatement: string
 *  }>
 * addHydrateClientComponentsScript: boolean,
 * }} params
 * @returns {string}
 */
function generateClientScriptTags({
  clientCode,
  clientComponentsScripts = [],
  clientComponents = new Map(),
  addHydrateClientComponentsScript = false, 
}) {
  if (!clientCode) return "";
  // replace component imports to point to .js files
  for (const { importStatement } of clientComponents.values()) {
    clientCode = clientCode.replace(`${importStatement};`, '').replace(importStatement, "");
  }

  const clientCodeWithoutComponentImports = clientCode
    .split("\n")
    .filter((line) => !/^\s*import\s+.*['"].*\.html['"]/.test(line))
    .join("\n")
    .trim();

  const scripts = `
    ${addHydrateClientComponentsScript 
      ? `<script src="/public/_app/services/hydrate-client-components.js"></script>` 
      : ""
    }
    ${clientCodeWithoutComponentImports.trim() 
      ? `<script type="module">\n${clientCodeWithoutComponentImports}\n</script>`
      : ""
    }
    ${clientComponentsScripts?.length ? clientComponentsScripts.join("\n") : ""}
  `;

  return scripts.trim();
}

/**
 * Sends HTML response
 * @param {import("http").ServerResponse} res
 * @param {number} statusCode
 * @param {string} html
 */
const sendResponse = (res, statusCode, html) => {
  res.writeHead(statusCode, { "Content-Type": "text/html" });
  res.end(html);
};

/**
 * Start stream response, sending html and update html chunks
 * @param {import("http").ServerResponse} res
 * @param {string[]} htmlChunks
 */
const sendStartStreamChunkResponse = (res, statusCode, html, htmlChunks) => {
  res.writeHead(statusCode, {
    "Content-Type": "text/html; charset=utf-8",
    "Transfer-Encoding": "chunked",
    "X-Content-Type-Options": "nosniff",
  });
  sendStreamChunkResponse(res, html, htmlChunks)
};

/**
 * Send html and update html chunks
 * @param {import("http").ServerResponse} res
 * @param {string[]} htmlChunks
 */
const sendStreamChunkResponse = (res, html, htmlChunks) => {
  res.write(html);
  htmlChunks.push(html);
}

/**
 * Close html and end response
 * @param {import("http").ServerResponse} res
 * @param {string[]} htmlChunks
 */
const endStreamResponse = (res, htmlChunks) => {
  res.write("</body></html>");
  res.end();
  htmlChunks.push("</body></html>")
}
/**
 * Renders a page with layout and streaming support
 * @param {string} pagePath - Full path to page.html
 * @param {{
 *  [key: string]: any
 *  req: import("http").IncomingMessage,
 *  res: import("http").ServerResponse,
 * }} ctx - Context request with additional data to pass to getData
 * @returns {Promise<{
 *  html: string,
 *  suspenseComponents: Array<{id: string, content: string}>,
 *  serverComponents: Map<string, { path: string, originalPath: string, importStatement: string }>,
 *  clientComponents: Map<string, { path: string, originalPath: string, importStatement: string }>
 * }>}
 */
async function renderPageWithLayout(pagePath, ctx) {
  const { html, metadata, clientCode, serverComponents, clientComponents } =
    await renderHtmlFile(pagePath, ctx);

  // Process server components and suspense
  const {
    html: processedHtml,
    suspenseComponents,
    clientComponentsScripts = [],
  } = await renderComponents({
    html,
    serverComponents,
    clientComponents,
  });

  // Wrap in layout
  const clientScripts = generateClientScriptTags({
    clientCode,
    clientComponentsScripts,
    clientComponents,
    addHydrateClientComponentsScript: clientComponents.size > 0,
  });

  const layoutTemplate = await getLayoutTemplate();
  const fullHtml = compileTemplateToHTML(layoutTemplate, {
    children: processedHtml,
    clientScripts,
    metadata: { ...DEFAULT_METADATA, ...metadata },
  });

  return {
    html: fullHtml,
    suspenseComponents,
    serverComponents,
    clientComponents,
  };
}

/**
 * Renders and sends a page with streaming
 * @param {{
 *  pageName: string,
 *  statusCode?: number,
 *  context: { [key: string]: any, req: import("http").IncomingMessage, res: import("http").ServerResponse }
 *  route: { 
 *    path: string,
 *    serverPath: string,
 *    meta: {
 *      ssr: boolean,
 *      requiresAuth: false,
 *      revalidateSeconds: 60, 
 *    }
 * }
 * }}
 */
async function renderAndSendPage({
  pageName,
  statusCode = 200,
  context = {},
  route,
}) {
  const pagePath = getPagePath(pageName);
  const revalidateSeconds = route.meta?.revalidateSeconds ?? 0;
  const isISR = revalidateSeconds > 0;

  if(isISR) {
    const { html: cachedHtml, isStale } = getCachedComponentHtml({ 
      componentPath: context.req.url, 
      revalidateSeconds: route.meta.revalidateSeconds,
    });

    if(cachedHtml && !isStale) {
      sendResponse(context.res, statusCode, cachedHtml);
      return;
    }
  }
  
  const { html, suspenseComponents, serverComponents } =
    await renderPageWithLayout(pagePath, context);

  // if no suspense components, send immediately
  if (suspenseComponents.length === 0) {
    sendResponse(context.res, statusCode, html);
    if(isISR) {
      setCachedComponentHtml({ componentPath: context.req.url, html });
    }
    return;
  }

  const htmlChunks = [];
  let abortedStream = false;
  let errorStream = false

  context.res.on("close", () => abortedStream = true);

  // Send initial HTML (before </body>)
  const [beforeClosing] = html.split("</body>");
  sendStartStreamChunkResponse(context.res, 200, beforeClosing, htmlChunks)

  // Stream suspense components
  const renderPromises = suspenseComponents.map(async (suspenseComponent) => {
    try {
      const renderedContent = await renderSuspenseComponent(
        suspenseComponent,
        serverComponents
      );

      const replacementContent = generateReplacementContent(
        suspenseComponent.id,
        renderedContent
      );
      sendStreamChunkResponse(context.res, replacementContent, htmlChunks)
    } catch (error) {
      console.error(`Error rendering suspense ${suspenseComponent.id}:`, error);
      const errorContent = generateReplacementContent(
        suspenseComponent.id,
        `<div class="text-red-500">Error loading content</div>`
      );
      res.write(errorContent);
      errorStream = true;
    }
  });

  await Promise.all(renderPromises);

  endStreamResponse(context.res, htmlChunks);
  if(isISR && !abortedStream && !errorStream) {
    setCachedComponentHtml({
      componentPath: pagePath,
      html: htmlChunks.join("")
    });
  }
}

/**
 * Handles incoming page request
 * @param {import("http").IncomingMessage} req
 * @param {import("http").ServerResponse} res
 * @param {{ path: string, meta: object}} route
 */
export async function handlePageRequest(req, res, route) {
  if (!route) {
    const notFoundRoute = serverRoutes.find(r => r.isNotFound);
    return handlePageRequest(req, res, notFoundRoute);
  }

  const pageName = route.path.slice(1);

  const context = { req, res };

  try {
    await renderAndSendPage({ pageName, context, route });
  } catch (e) {
    const errorData = {
      message: e.message || "Internal server error",
      code: 500,
      details: "Could not load the requested page",
      path: route.path,
      stack: e.stack,
    };

    try {
      await renderAndSendPage({ 
        pageName: "error", 
        statusCode: 500, 
        context: { 
          ...context, 
          ...errorData,
        }, 
        route,
      });
    } catch (err) {
      console.error(`Failed to render error page: ${err.message}`);
      sendResponse(res, 500, FALLBACK_ERROR_HTML);
    }
  }
}
