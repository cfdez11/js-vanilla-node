import fs from "fs/promises";
import path from "path";
import { pathToFileURL, fileURLToPath } from "url";
import { compileTemplateToHTML } from "./template.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootPath = path.resolve(__dirname, "..", "..");

/**
 * Process script and return components imports and the rest imports
 * If isClientSide, only return HTML components map. This is to avoid importing JS modules of client side in the server.
 * @param {string} script
 * @param {boolean} isClientSide
 * @returns {Promise<{
 *   imports: Object,
 *   componentRegistry: Map<string, { path: string }>
 * }>}
 */
const getScriptImports = async (script, isClientSide = false) => {
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
    } else if (!isClientSide) {
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
    const { componentRegistry } = await getScriptImports(clientMatch[1], true);
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

/**
 * Converts template syntax to html`` tagged template syntax
 * Client has access to html function that knows how to render the return value.
 * @param {string} template
 * @param {string} clientCode - Client code to detect reactive variables
 * @returns {string} Converted template
 */
function convertVueToHtmlTagged(template, clientCode = "") {
  // Extract reactive variables from client code (only those created with ractive modules)
  const reactiveVars = new Set();
  const reactiveRegex =
    /(?:const|let|var)\s+(\w+)\s*=\s*(?:reactive|computed)\(/g;

  let match;

  while ((match = reactiveRegex.exec(clientCode)) !== null) {
    reactiveVars.add(match[1]);
  }

  /**
   * Helper to add .value only to reactive variables
   * Preserves member access (e.g., counter.value stays as counter.value)
   * Preserves method calls (e.g., increment() stays as increment())
   */
  const processExpression = (expr) => {
    return expr.replace(/\b(\w+)(?!\s*[\.\(])/g, (_, varName) => {
      return reactiveVars.has(varName) ? `${varName}.value` : varName;
    });
  };

  let result = template;

  // v-for="item in items" → ${items.value.map(item => html`...`)}
  result = result.replace(
    /<(\w+)([^>]*)\s+v-for="(\w+)\s+in\s+(\w+)(?:\.value)?"([^>]*)>([\s\S]*?)<\/\1>/g,
    (_, tag, beforeAttrs, iterVar, arrayVar, afterAttrs, content) => {
      // Add .value if it's a reactive variable
      const arrayAccess = reactiveVars.has(arrayVar)
        ? `${arrayVar}.value`
        : arrayVar;

      return `\${${arrayAccess}.map(${iterVar} => html\`<${tag}${beforeAttrs}${afterAttrs}>${content}</${tag}>\`)}`;
    }
  );

  // v-show="condition" → :hidden="${!condition.value}" (add .value for reactive vars)
  result = result.replace(/v-show="([^"]+)"/g, (_, condition) => {
    return `:hidden="\${!(${processExpression(condition)})}"`;
  });

  // {{variable}} → ${variable.value} (for reactive vars)
  result = result.replace(/\{\{([^}]+)\}\}/g, (_, expr) => {
    return `\${${processExpression(expr.trim())}}`;
  });

  // @click="handler" → @click="${handler}" (no .value for functions)
  result = result.replace(/@(\w+)="([^"]+)"/g, '@$1="${$2}"');

  // :prop="value" → :prop="${value.value}" (for reactive vars, but skip already processed ${...})
  result = result.replace(/:(\w+)="(?!\$\{)([^"]+)"/g, (_, attr, value) => {
    return `:${attr}="\${${processExpression(value)}}"`;
  });

  return result;
}

/**
 * Generates inlined client component with pre-compiled template
 * @param {string} componentName
 * @param {string} componentPath
 * @param {object} props
 * @returns {Promise<string>}
 */
export async function generateClientComponentInline(
  componentName,
  componentPath,
  props = {}
) {
  const targetId = `client-${componentName}-${Date.now()}`;

  // Read and process component
  const { clientCode, template } = await processHtmlFile(componentPath);

  // Compute final props with defaults
  const finalClientCode = addComputedProps(clientCode, props);

  // Convert Vue syntax to html`` tagged template (pass clientCode to detect reactive vars)
  const convertedTemplate = convertVueToHtmlTagged(template, finalClientCode);

  return `
    <template id="${targetId}"></template>
    <script type="module">
      import { effect } from '/public/app/services/reactive.js';
      import { html } from '/public/app/services/html.js';
      
      ${finalClientCode}
      
      const marker = document.getElementById('${targetId}');
      let root = null;

      function render() {
        const node = html\`${convertedTemplate}\`;  
        if (!root) {
          root = node;
          marker.replaceWith(node);
          return;
        }

        root.replaceWith(node);
        root = node;
      }

      effect(() => {        
        render();
      });
    </script>
  `;
}

/**
 * Extract vprops object literal from client code
 * @param {string} clientCode
 * @returns {string | null}
 */
function extractVPropsObject(clientCode) {
  const match = clientCode.match(/vprops\s*\(\s*(\{[\s\S]*?\})\s*\)/);
  return match ? match[1] : null;
}

/**
 * Avoid execute expressions with side effects like function calls, if, loops, etc.
 * @param {string} objectLiteral
 * @returns {object}
 */
function safeObjectEval(objectLiteral) {
  return Function(`"use strict"; return (${objectLiteral})`)();
}

/**
 * Applies default props from vprops definition
 * @param {object} vpropsDef
 * @param {object} componentProps
 * @returns {object}
 */
function applyDefaultProps(vpropsDefined, componentProps) {
  const finalProps = {};
  for (const key in vpropsDefined) {
    const def = vpropsDefined[key];
    if (key in componentProps) {
      finalProps[key] = componentProps[key];
    } else if ("default" in def) {
      finalProps[key] = def.default;
    } else {
      finalProps[key] = undefined;
    }
  }

  return finalProps;
}

/**
 * Compute props used in the client code
 * @param {string} clientCode
 * @param {object} componentProps
 */
function computeProps(clientCode, componentProps) {
  const vpropsLiteral = extractVPropsObject(clientCode);

  if (!vpropsLiteral) return componentProps;

  const vpropsDefined = safeObjectEval(vpropsLiteral);

  return applyDefaultProps(vpropsDefined, componentProps);
}

/**
 * Adds computed props to client code if are defined.
 * Replaces vprops(...) by const props = { ... };
 * @param {string} clientCode
 * @param {object} componentProps
 */
function addComputedProps(clientCode, componentProps) {
  const vpropsRegex = /const\s+props\s*=\s*vprops\s*\([\s\S]*?\)\s*;?/;
  if (!vpropsRegex.test(clientCode)) return clientCode;

  const computedProps = computeProps(clientCode, componentProps);

  return clientCode.replace(
    vpropsRegex,
    `const props = ${JSON.stringify(computedProps)};`
  );
}
