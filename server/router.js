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
import { errorRoute, notFoundRoute } from "./_app/routes.js";

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
 * @param {string} clientCode
 * @param {Array<string>} componentScripts
 * @param {
 *  Map<string, {
 *    path: string,
 *    originalPath: string,
 *    importStatement: string
 *  }>} clientComponents
 * @returns {string}
 */
function generateClientScriptTags(
  clientCode,
  componentScripts = [],
  clientComponents = new Map()
) {
  if (!clientCode) return "";
  // replace component imports to point to .js files
  for (const { importStatement } of clientComponents.values()) {
    clientCode = clientCode.replace(importStatement, "");
  }

  const clientCodeWithoutComponentImports = clientCode
    .split("\n")
    .filter((line) => !/^\s*import\s+.*['"].*\.html['"]/.test(line))
    .join("\n");

  const scripts = `
    <script src="/public/app/services/hydrate-client-components.js"></script>
    <script type="module">\n${clientCodeWithoutComponentImports}\n</script>\n${componentScripts}
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
 * Renders a page with layout and streaming support
 * @param {string} pagePath - Full path to page.html
 * @param {any} data - Additional data to pass to getData
 * @returns {Promise<{
 *  html: string,
 *  suspenseComponents: Array<{id: string, content: string}>,
 *  serverComponents: Map<string, { path: string, originalPath: string, importStatement: string }>,
 *  clientComponents: Map<string, { path: string, originalPath: string, importStatement: string }>
 * }>}
 */
async function renderPageWithLayout(pagePath, data = null) {
  const { html, metadata, clientCode, serverComponents, clientComponents } =
    await renderHtmlFile(pagePath, data);

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
  const clientScripts = generateClientScriptTags(
    clientCode,
    clientComponentsScripts.join("\n"),
    clientComponents
  );

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
 * @param {import("http").ServerResponse} res
 * @param {string} pageName
 * @param {number} statusCode
 * @param {any} additionalData
 */
async function renderAndSendPage(
  res,
  pageName,
  statusCode = 200,
  additionalData = null
) {
  const pagePath = getPagePath(pageName);
  const { html, suspenseComponents, serverComponents } =
    await renderPageWithLayout(pagePath, additionalData);

  // if no suspense components, send immediately
  if (suspenseComponents.length === 0) {
    sendResponse(res, statusCode, html);
    return;
  }

  // Enable streaming
  res.writeHead(statusCode, {
    "Content-Type": "text/html; charset=utf-8",
    "Transfer-Encoding": "chunked",
    "X-Content-Type-Options": "nosniff",
  });

  // Send initial HTML (before </body>)
  const [beforeClosing] = html.split("</body>");
  res.write(beforeClosing);

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
      res.write(replacementContent);
    } catch (error) {
      console.error(`Error rendering suspense ${suspenseComponent.id}:`, error);
      const errorContent = generateReplacementContent(
        suspenseComponent.id,
        `<div class="text-red-500">Error loading content</div>`
      );
      res.write(errorContent);
    }
  });

  await Promise.all(renderPromises);

  res.write("</body></html>");
  res.end();
}

/**
 * Handles incoming page request
 * @param {import("http").IncomingMessage} req
 * @param {import("http").ServerResponse} res
 * @param {{path: string, meta: object}} route
 */
export async function handlePageRequest(req, res, route) {
  if (!route) {
    return handlePageRequest(req, res, notFoundRoute);
  }

  if (route === errorRoute.path) {
    throw new Error("Simulated error for testing error page.");
  }

  const pageName = route.path.slice(1);

  try {
    await renderAndSendPage(res, pageName);
  } catch (e) {
    const errorData = {
      message: e.message || "Internal server error",
      code: 500,
      details: "Could not load the requested page",
      path: route.path,
      stack: e.stack,
    };

    try {
      await renderAndSendPage(res, "error", 500, errorData);
    } catch (err) {
      console.error(`Failed to render error page: ${err.message}`);
      sendResponse(res, 500, FALLBACK_ERROR_HTML);
    }
  }
}
