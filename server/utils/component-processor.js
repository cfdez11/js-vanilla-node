import fs from "fs/promises";
import path from "path";
import { pathToFileURL, fileURLToPath } from "url";
import { compileTemplateToHTML } from "./template.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootPath = path.resolve(__dirname, "..", "..");

/**
 * Process script and return components imports and the rest imports
 * @param {string} script
 * @returns {Promise<{
 *   imports: Object,
 *   componentRegistry: Map<string, { path: string }>
 * }>}
 */
const getScriptImports = async (script) => {
  const componentRegistry = new Map();
  const imports = {};
  const importRegex =
    /import\s+(?:([a-zA-Z_$][\w$]*)|\{([^}]*)\})\s+from\s+['"]([^'"]+)['"]/g;
  let match;

  // Process imports
  while ((match = importRegex.exec(script)) !== null) {
    const [_, defaultImport, namedImports, modulePath] = match;

    const resolvedPath = path.resolve(rootPath, modulePath);
    const fileUrl = pathToFileURL(resolvedPath).href;

    if (resolvedPath.endsWith(".html")) {
      // Recursively process HTML component
      if (defaultImport) {
        componentRegistry.set(defaultImport, { path: resolvedPath });
      }
    } else {
      // Import JS module
      const module = await import(fileUrl);
      if (defaultImport) {
        imports[defaultImport] = module.default || module[defaultImport];
      }
      if (namedImports) {
        namedImports.split(",").forEach((name) => {
          const trimmedName = name.trim();
          imports[trimmedName] = module[trimmedName];
        });
      }
    }
  }

  return { imports, componentRegistry };
};

/**
 * Extracts scripts, template, data and components from an HTML component/page file
 * @param {string} filePath - Full path to the HTML file
 * @returns {Promise<{
 *   getData: Function | null,
 *   metadata: object,
 *   template: string,
 *   clientCode: string,
 *   serverComponents: Map<string, { path: string }>
 *   clientComponents: Map<string, { path: string }>
 * }>}
 */
export async function processHtmlFile(filePath) {
  const content = await fs.readFile(filePath, "utf-8");

  const serverMatch = content.match(/<script server>([\s\S]*?)<\/script>/);
  const clientMatch = content.match(/<script client>([\s\S]*?)<\/script>/);
  const templateMatch = content.match(/<template>([\s\S]*?)<\/template>/);

  const template = templateMatch ? templateMatch[1].trim() : "";
  const clientCode = clientMatch ? clientMatch[1].trim() : "";
  let serverComponents = new Map();
  let clientComponents = new Map();

  let getData = null;
  let metadata = {};

  if (serverMatch) {
    const scriptContent = serverMatch[1];
    const { componentRegistry, imports } = await getScriptImports(
      scriptContent
    );

    serverComponents = componentRegistry;

    // Clean script and execute
    const cleanedScript = scriptContent
      .replace(
        /import\s+(?:(?:[a-zA-Z_$][\w$]*)|\{[^}]*\})\s+from\s+['"][^'"]*['"];?\n?/g,
        ""
      )
      .replace(/export\s+/g, "")
      .trim();

    if (cleanedScript) {
      const AsyncFunction = Object.getPrototypeOf(
        async function () {}
      ).constructor;
      const fn = new AsyncFunction(
        ...Object.keys(imports),
        `
        ${cleanedScript}
        ${!cleanedScript.includes("getData") ? "const getData = null;" : ""}
        ${!cleanedScript.includes("metadata") ? "const metadata = {};" : ""}
        return { getData, metadata: metadata || {} };
      `
      );

      try {
        const result = await fn(...Object.values(imports));
        getData = result.getData;
        metadata = result.metadata;
      } catch (error) {
        console.error(`Error executing script in ${filePath}:`, error.message);
      }
    }
  }

  if (clientMatch) {
    const { componentRegistry } = await getScriptImports(clientMatch[1]);
    clientComponents = componentRegistry;
  }

  return {
    getData,
    metadata,
    template,
    clientCode,
    serverComponents,
    clientComponents,
  };
}

/**
 * Renders an HTML file (page or component) with data
 * @param {string} filePath - Full path to the HTML file
 * @param {any} data - Data to pass to getData function
 * @returns {Promise<{
 *   html: string,
 *   metadata: object,
 *   clientCode: string,
 *   serverComponents: Map<string, { path: string }>,
 *   clientComponents: Map<string, { path: string }>,
 * }>}
 */
export async function renderHtmlFile(filePath, data = null) {
  const {
    getData,
    metadata,
    template,
    clientCode,
    serverComponents,
    clientComponents,
  } = await processHtmlFile(filePath);

  const componentData = getData ? await getData(data) : {};
  const html = compileTemplateToHTML(template, componentData);

  return { html, metadata, clientCode, serverComponents, clientComponents };
}
