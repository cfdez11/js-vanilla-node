import path from "path";
import { fileURLToPath } from "url";
import { renderTemplate } from "./utils/template.js";
import {
  extractSuspenseBoundaries,
  renderNonSuspendedComponents,
  renderSuspenseContent,
  generateReplacementContent,
} from "./utils/streaming.js";
import { errorRoute, notFoundRoute } from "./_app/routes.js";
import fs from "fs/promises";

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
 * @param {string} file
 * @returns {string}
 */
const getPagePath = (pageName, file = "page.html") =>
  path.resolve(PAGES_DIR, pageName, file);

/**
 * Sends HTML response to client and close request
 * @param {import("http").ServerResponse} res
 * @param {number} statusCode
 * @param {string} html
 */
const sendResponse = (res, statusCode, html) => {
  res.writeHead(statusCode, { "Content-Type": "text/html" });
  res.end(html);
};

/**
 * Extracts server script, client script from HTML page
 * @param {string} pageContent
 * @returns {{
 *  getData: Promise | null,
 *  metadata: {
 *  title?: string,
 *  description?: string,
 * },
 *  clientCode: string
 * }}
 */
function extractPageScripts(pageContent) {
  // Extract server-side script
  const serverMatch = pageContent.match(/<script server>([\s\S]*?)<\/script>/);
  // Extract client-side script:
  const clientMatch = pageContent.match(/<script client>([\s\S]*?)<\/script>/);

  let getData = null;
  let metadata = {};
  const clientCode = clientMatch ? clientMatch[1].trim() : "";

  if (serverMatch) {
    try {
      // Remove import statements (they can't run in new Function)
      const cleanedScript = serverMatch[1]
        .replace(/import\s+.*?;?\n?/g, "")
        .trim();

      const moduleCode = `
        ${cleanedScript}
        return { 
          getData: typeof getData !== 'undefined' ? getData : null, 
          metadata: typeof metadata !== 'undefined' ? metadata : {} 
        };
      `;
      const result = new Function(moduleCode)();
      getData = result.getData;
      metadata = result.metadata;
    } catch (error) {
      console.warn(`Error evaluating server script: ${error.message}`);
    }
  }

  return { getData, metadata, clientCode };
}

/** Loads page and extracts data, metadata and client code */
/**
 * Loads page and extracts data, metadata and client code
 * @param {string} pageName
 * @param {any} additionalData
 * @returns {Promise<{
 *  data: any,
 *  metadata: {
 *    title?: string,
 *    description?: string,
 *  },
 *  clientCode: string - client-side js code to run in script
 * }>}
 */
async function loadPageTemplate(pageName, additionalData = null) {
  try {
    const templateContent = await fs.readFile(getPagePath(pageName), "utf-8");
    const { getData, metadata, clientCode } =
      extractPageScripts(templateContent);
    const data = (await getData?.(additionalData)) ?? {};
    return { data, metadata, clientCode };
  } catch (error) {
    throw new Error(
      `Could not load template for page "${pageName}": ${error.message}`
    );
  }
}

/**
 * Generates client script tag with module type
 * @param {string} clientCode
 * @returns {string}
 */
function generateClientScriptTag(clientCode) {
  if (!clientCode) return "";
  return `<script type="module">\n${clientCode}\n</script>`;
}

/** Renders a complete page with layout - returns initial HTML and suspense components */
/**
 *
 * @param {string} pageName
 * @param {any} data
 * @param {object} metadata
 * @param {string} clientCode
 * @returns {Promise<{fullHtml: string, suspenseComponents: any[]}>}
 */
async function renderPage(pageName, data, metadata = {}, clientCode = "") {
  let pageHtml = renderTemplate(getPagePath(pageName), data);

  // First render non-suspended server components
  pageHtml = await renderNonSuspendedComponents(pageHtml);

  // Extract suspense boundaries and get initial HTML with fallbacks (now async)
  const { initialHtml, suspenseComponents } = await extractSuspenseBoundaries(
    pageHtml
  );

  const clientScripts = generateClientScriptTag(clientCode);

  const fullHtml = renderTemplate(path.resolve(PAGES_DIR, "layout.html"), {
    children: initialHtml,
    clientScripts,
    metadata: { ...DEFAULT_METADATA, ...metadata },
  });

  return { fullHtml, suspenseComponents };
}

/**
 * Renders and sends a page
 * @param {import("http").ServerResponse} res
 * @param {string} pageName
 * @param {number} statusCode
 * @param {any} additionalData
 * @returns {Promise<void>}
 */
async function renderAndSend(
  res,
  pageName,
  statusCode = 200,
  additionalData = null
) {
  const { data, metadata, clientCode } = await loadPageTemplate(
    pageName,
    additionalData
  );
  const { fullHtml, suspenseComponents } = await renderPage(
    pageName,
    data,
    metadata,
    clientCode
  );

  // If no suspense components, send response and close request
  if (suspenseComponents.length === 0) {
    sendResponse(res, statusCode, fullHtml);
    return;
  }

  // Enable streaming
  res.writeHead(statusCode, {
    "Content-Type": "text/html; charset=utf-8",
    "Transfer-Encoding": "chunked",
    "X-Content-Type-Options": "nosniff",
  });

  // Send initial HTML (with fallbacks) immediately
  // Remove closing </body></html> tags to allow streaming more content
  const [beforeClosing] = fullHtml.split("</body>");
  res.write(beforeClosing);

  // Render suspense components in parallel and stream as they complete
  const renderPromises = suspenseComponents.map(async (suspense) => {
    try {
      const renderedContent = await renderSuspenseContent(suspense);
      const replacementContent = generateReplacementContent(
        suspense.id,
        renderedContent
      );
      res.write(replacementContent);
    } catch (error) {
      console.error(`Error rendering suspense ${suspense.id}:`, error);
      const errorReplacementContent = generateReplacementContent(
        suspense.id,
        `<div class="text-red-500">Error loading content</div>`
      );
      res.write(errorReplacementContent);
    }
  });

  // Wait for all suspense components to complete
  await Promise.all(renderPromises);

  // Close the document and response
  res.write("</body></html>");
  res.end();
}

/**
 *  Handles incoming page request
 * @param {import("http").IncomingMessage} req
 * @param {import("http").ServerResponse} res
 * @param {{ path: string, meta: { ssr: boolean, requiresAuth: boolean } }} route
 * @returns {Promise<void>}
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
    await renderAndSend(res, pageName);
  } catch (e) {
    const errorData = {
      message: e.message || "Internal server error",
      code: 500,
      details: "Could not load the requested page",
      path: route.path,
      stack: e.stack,
    };

    try {
      await renderAndSend(res, "error", 500, errorData);
    } catch (err) {
      console.error(`Failed to render error page: ${err.message}`);
      sendResponse(res, 500, FALLBACK_ERROR_HTML);
    }
  }
}
