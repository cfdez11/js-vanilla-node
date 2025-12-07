import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { renderTemplate } from "./utils/template.js";
import { renderServerComponents } from "./utils/ssr.js";
import { errorRoute, notFoundRoute } from "./_app/routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Renderiza una página completa con layout
 */
async function renderPage(pageName, data, metadata) {
  const templateFile = "template.html";
  const templatePath = path.resolve(
    __dirname,
    "..",
    "pages",
    pageName,
    templateFile
  );

  let pageHtml = renderTemplate(templatePath, data);
  pageHtml = await renderServerComponents(pageHtml);

  const layoutPath = path.resolve(__dirname, "../pages/layout.html");
  return renderTemplate(layoutPath, {
    children: pageHtml,
    metadata: {
      title: metadata?.title || "Mi Sitio SSR",
      description: metadata?.description || "Descripción por defecto",
    },
  });
}

/**
 * Carga el template y extrae datos y metadatos
 */
async function loadPageTemplate(pageName, additionalData = null) {
  const templatePath = path.resolve(
    __dirname,
    "..",
    "pages",
    pageName,
    "template.html"
  );

  try {
    const templateContent = await fs.readFile(templatePath, "utf-8");
    const { getData, metadata } = await extractTemplateScript(templateContent);

    const data = getData ? await getData(additionalData) : {};

    return { data, metadata };
  } catch (error) {
    throw new Error(
      `Could not load template for page "${pageName}": ${error.message}`
    );
  }
}

/**
 * Carga y ejecuta el módulo de una página
 */
async function loadPageModule(pageName, additionalData = null) {
  const pagePath = path.resolve(__dirname, "..", "pages", pageName, "page.js");
  const pageModule = await import(pathToFileURL(pagePath).href);

  const data = pageModule.getData
    ? await pageModule.getData(additionalData)
    : {};

  return {
    data,
    metadata: pageModule.metadata,
  };
}

/**
 * Envía respuesta HTML al cliente
 */
function sendResponse(res, statusCode, html) {
  res.writeHead(statusCode, { "Content-Type": "text/html" });
  res.end(html);
}

/**
 * Genera HTML de fallback para errores críticos
 */
function getFallbackErrorHtml() {
  return `
    <!DOCTYPE html>
    <html>
    <head><title>Error 500</title></head>
    <body>
      <h1>Error 500 - Internal Server Error</h1>
      <p>Ha ocurrido un error inesperado.</p>
      <p><a href="/">Volver al inicio</a></p>
    </body>
    </html>
  `;
}

export async function handlePageRequest(req, res, route) {
  if (!route) {
    res.writeHead(404);
    handlePageRequest(req, res, notFoundRoute);
    return;
  }

  if (route === errorRoute.path) {
    throw new Error("Simulated error for testing error page.");
  }

  const pageName = route.path.slice(1);

  try {
    // Cargar y renderizar página normal
    const { data, metadata } = await loadPageModule(pageName);
    const html = await renderPage(pageName, data, metadata);

    sendResponse(res, 200, html);
  } catch (e) {
    // Datos del error
    const errorData = {
      message: e.message || "Error interno del servidor",
      code: 500,
      details: "No se pudo cargar la página solicitada",
      path: route.path,
      stack: e.stack,
    };

    try {
      // Intentar renderizar la página de error
      const { data: errorPageData, metadata: errorMetadata } =
        await loadPageModule("error", errorData);
      const errorHtml = await renderPage("error", errorPageData, errorMetadata);

      sendResponse(res, 500, errorHtml);
    } catch (errorPageError) {
      sendResponse(res, 500, getFallbackErrorHtml());
    }
  }
}
