import path from "path";
import { fileURLToPath } from "url";
import { renderTemplate } from "./utils/template.js";
import { renderServerComponents } from "./utils/ssr.js";
import { errorRoute, notFoundRoute } from "./_app/routes.js";
import fs from "fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PAGES_DIR = path.resolve(__dirname, "..", "pages");

const DEFAULT_METADATA = {
  title: "My SSR Site",
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

/** Builds the path to a page file */
const getPagePath = (pageName, file = "page.html") =>
  path.resolve(PAGES_DIR, pageName, file);

/** Sends HTML response to client */
const sendResponse = (res, statusCode, html) => {
  res.writeHead(statusCode, { "Content-Type": "text/html" });
  res.end(html);
};

/** Extracts server script, client script from HTML page */
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

/** Generates client script tag with module type */
function generateClientScriptTag(clientCode) {
  if (!clientCode) return "";
  return `<script type="module">\n${clientCode}\n</script>`;
}

/** Renders a complete page with layout */
async function renderPage(pageName, data, metadata = {}, clientCode = "") {
  let pageHtml = renderTemplate(getPagePath(pageName), data);
  pageHtml = await renderServerComponents(pageHtml);

  const clientScripts = generateClientScriptTag(clientCode);

  return renderTemplate(path.resolve(PAGES_DIR, "layout.html"), {
    children: pageHtml,
    clientScripts,
    metadata: { ...DEFAULT_METADATA, ...metadata },
  });
}

/** Renders and sends a page */
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
  const html = await renderPage(pageName, data, metadata, clientCode);
  sendResponse(res, statusCode, html);
}

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
