import fs from "fs/promises";
import path from "path";
import { pathToFileURL, fileURLToPath } from "url";
import { compileTemplateToHTML } from "./template.js";
import { getComponentNameFromPath, readDirectoryRecursive } from "./files.js";
import { renderComponents } from "./streaming.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootPath = path.resolve(__dirname, "..", "..");

/**
 * Process script and return components imports and the rest imports
 * If isClientSide, return HTML components map and client imports without execution, to avoid execute JS modules of client side in the server.
 * @param {string} script
 * @param {boolean} isClientSide
 * @returns {Promise<{
 *   imports: Object,
 *   componentRegistry: Map<string, {
 *    path: string,
 *    originalPath: string,
 *    importStatement: string
 *   }>,
 *   clientImports: [{
 *      fileUrl: string,
 *      originalPath: string,
 *      importStatement: string
 *    }],
 *  }
 * }>}
 */
const getScriptImports = async (script, isClientSide = false) => {
  const componentRegistry = new Map();
  const imports = {};
  const clientImports = {};
  const importRegex =
    /import\s+(?:([a-zA-Z_$][\w$]*)|\{([^}]*)\})\s+from\s+['"]([^'"]+)['"]/g;
  let match;

  // Process imports
  while ((match = importRegex.exec(script)) !== null) {
    const [importStatement, defaultImport, namedImports, modulePath] = match;

    const resolvedPath = path.resolve(rootPath, modulePath);
    const fileUrl = pathToFileURL(resolvedPath).href;

    if (resolvedPath.endsWith(".html")) {
      // Recursively process HTML component
      if (defaultImport) {
        componentRegistry.set(defaultImport, {
          path: resolvedPath,
          originalPath: modulePath,
          importStatement,
        });
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
    } else if (defaultImport) {
      // client side default imports and named imports
      clientImports[defaultImport || namedImports] = {
        fileUrl,
        originalPath: modulePath,
        importStatement,
      };
    } else {
      namedImports.split(",").forEach((name) => {
        const trimmedName = name.trim();
        clientImports[trimmedName] = {
          fileUrl,
          originalPath: modulePath,
          importStatement,
        };
      });
    }
  }

  return { imports, componentRegistry, clientImports };
};

/**
 * Extracts scripts, template, data and components from an HTML component/page file
 * @param {string} filePath - Full path to the HTML file
 * @returns {Promise<{
 *   getData: Function | null,
 *   metadata: object,
 *   template: string,
 *   clientCode: string,
 *   clientImports: [{
 *      fileUrl: string,
 *      originalPath: string,
 *      importStatement: string
 *    }],
 *   serverComponents: Map<string, { path: string, originalPath: string, importStatement: string }>,
 *   clientComponents: Map<string, { path: string, originalPath: string, importStatement: string }>,
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
  let clientImports = {};

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
    const { componentRegistry, clientImports: newClientImports } = await getScriptImports(clientMatch[1], true);
    clientComponents = componentRegistry;
    clientImports = newClientImports;
  }

  return {
    getData,
    metadata,
    template,
    clientCode,
    serverComponents,
    clientComponents,
    clientImports,
  };
}

/**
 * Renders an HTML file (page or component) with data
 * @param {string} filePath - Full path to the HTML file
 * @param {{
 *  [key: string]: any
 *  req: import("http").IncomingMessage,
 *  res: import("http").ServerResponse,
 * }} ctx - Context request with additional data to pass to getData
 * @returns {Promise<{
 *   html: string,
 *   metadata: object,
 *   clientCode: string,
 *   serverComponents: Map<string, { path: string, originalPath: string, importStatement: string }>,
 *   clientComponents: Map<string, { path: string, originalPath: string, importStatement: string }>,
 * }>}
 */
export async function renderHtmlFile(filePath, context = {}) {
  const {
    getData,
    metadata,
    template,
    clientCode,
    serverComponents,
    clientComponents,
  } = await processHtmlFile(filePath);

  const componentData = getData ? await getData(context) : {};
  const html = compileTemplateToHTML(template, componentData);

  return { html, metadata, clientCode, serverComponents, clientComponents };
}


/**
 * Converts a Vue-like template into an html string to use in client with html service function 
 * (uses tagged template literal).
 * 
 * This function transforms a template using Vue directives (`v-for`, `v-if`, `v-else-if`, `v-else`, `v-show`),
 * property bindings (`:prop="value"`), interpolations (`{{variable}}`), and events (`@click="handler"`)
 * into a template literal that can be rendered by the client's `html` function.
 * 
 * It also detects reactive variables declared in the client code using `reactive` or `computed`
 * and automatically appends `.value` when they are used in the template.
 * 
 * Supported syntax:
 * - `v-for="item in items"` → `${items.value.map(item => html`<tag>...</tag>`)}`  
 * - `v-if="condition"` → `${condition.value ? html`<tag>...</tag>` : ''}`  
 * - `v-else-if="condition"` → `${condition.value ? html`<tag>...</tag>` : ...}`  
 * - `v-else` → `${html`<tag>...</tag>`}`  
 * - `v-show="condition"` → `:hidden="${!condition.value}"`  
 * - Interpolations `{{variable}}` → `${variable.value}`  
 * - Property bindings `:prop="value"` → `:prop="${value.value}"`  
 * - Event bindings `@click="handler"` → `@click="${handler}"` or `@click="${() => handler()}"` if it is a function call  
 * 
 * @param {string} template - The input template with Vue-like syntax
 * @param {string} [clientCode=""] - Client-side code to detect reactive variables
 * @returns {string} Template converted to `html`` ` tagged template syntax
 */
function convertVueToHtmlTagged(template, clientCode = "") {
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

  let result = template.trim();

  // v-for="item in items" → ${items.value.map(item => html`...`)}
  result = result.replace(
    /<(\w+)([^>]*)\s+v-for="(\w+)\s+in\s+([^"]+)(?:\.value)?"([^>]*)>([\s\S]*?)<\/\1>/g,
    (_, tag, beforeAttrs, iterVar, arrayVar, afterAttrs, content) => {
      const cleanExpr = arrayVar.trim();
      const isSimpleVar = /^\w+$/.test(cleanExpr);
      const arrayAccess = isSimpleVar && reactiveVars.has(cleanExpr)
        ? `${cleanExpr}.value`
        : cleanExpr;
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
  result = result.replace(/@(\w+)="([^"]+)"/g, (_, event, handler) => {
    const isArrowFunction = /^\s*\(?.*?\)?\s*=>/.test(handler);
    const isFunctionCall = /[\w$]+\s*\(.*\)/.test(handler.trim());

    if (isArrowFunction) {
      return `@${event}="\${${handler.trim()}}"`;
    } else if (isFunctionCall) {
      return `@${event}="\${() => ${handler.trim()}}"`;
    } else {
      return `@${event}="\${${handler.trim()}}"`;
    }
  });

  // :prop="value" → :prop="${value.value}" (for reactive vars, but skip already processed ${...})
  result = result.replace(/:(\w+)="(?!\$\{)([^"]+)"/g, (_, attr, value) => {
    return `:${attr}="\${${processExpression(value)}}"`;
  });

  // v-if="condition" → v-if="${condition}"
  result = result.replace(/v-if="([^"]*)"/g, 'v-if="${$1}"');

  // v-else-if="condition" → v-else-if="${condition}"
  result = result.replace(/v-else-if="([^"]*)"/g, 'v-else-if="${$1}"');
  
  return result;
}


/**
 * Return array of imports, ensuring required imports are in client code.
 *  @param {[{
 *    fileUrl: string,
 *    originalPath: string,
 *    importStatement: string
 * }]} clientImports,
 * @param {Map<string, { 
 *  path: string, 
 *  originalPath: string, 
 *  importStatement: string,
 * }>} clientComponents,
 * @param {{
 *  [modulePath: string]: string[]
 * }} requiredImports - Map of module path: required modules
 * @returns {Promise<string[]>}
 */
async function getClientCodeImports(
  clientImports,
  requiredImports = {
    "/public/_app/services/reactive.js": ["effect"],
    "/public/_app/services/html.js": ["html"],
  }
) {

  // Create a unique set of import statements to avoid duplicates
  const cleanImportsSet = new Set(
    Object.values(clientImports).map((importData) => importData.importStatement)
  );
  const cleanImports = Array.from(cleanImportsSet);

  for (const [modulePath, requiredModules] of Object.entries(requiredImports)) {
    const importIndex = cleanImports.findIndex((imp) =>
      new RegExp(`from\\s+['"]${modulePath}['"]`).test(imp)
    );

    if (importIndex === -1) {
      cleanImports.push(
        `import { ${requiredModules.join(", ")} } from '${modulePath}';`
      );
    } else {
      // if import exists, ensure it includes all required symbols
      const existingImport = cleanImports[importIndex];
      const importMatch = existingImport.match(/\{([^}]+)\}/);

      if (importMatch) {
        const importedModules = importMatch[1].split(",").map((s) => s.trim());
        // Determine which required modules are missing
        const missingModules = requiredModules.filter(
          (s) => !importedModules.includes(s)
        );
        if (missingModules.length > 0) {
          // Add missing symbols and reconstruct the import statement
          importedModules.push(...missingModules);
          cleanImports[importIndex] = existingImport.replace(
            /\{[^}]+\}/,
            `{ ${importedModules.join(", ")} }`
          );
        }
      } else {
        // If no named imports, convert to named imports
        cleanImports[importIndex] = `import { ${requiredModules.join(
          ", "
        )} } from '${modulePath}';`;
      }
    }
  }

  // Return the final list of import statements
  return cleanImports;
}

/**
 * Generates static JS module for client component
 * @param {string} componentPath
 * @returns {Promise<string>}
 */
export async function generateClientComponentModule(componentPath) {
  const { clientCode, template, clientComponents,  clientImports, metadata } = await processHtmlFile(componentPath);

  // Extract default props from vprops
  const defaults = extractVPropsDefaults(clientCode);

  const clientCodeWithProps = addComputedProps(clientCode, defaults);

  // Remove vprops declaration and imports from client code
  const cleanClientCode = clientCodeWithProps
    .replace(/const\s+props\s*=\s*vprops\s*\([\s\S]*?\)\s*;?/g, "")
    .replace(/^\s*import\s+.*$/gm, "")
    .trim();

  // Convert template
  const convertedTemplate = convertVueToHtmlTagged(template, clientCodeWithProps);

  const { html: processedHtml  } = await renderComponents({ html: convertedTemplate, clientComponents});

  const cleanImports = await getClientCodeImports(clientImports);

  const clientComponentModule = `
    ${cleanImports.join("\n")}  

    export const metadata = ${JSON.stringify(metadata || {})}
    
    export function hydrateClientComponent(marker) {
      ${cleanClientCode}
      
      let root = null;
      function render() {
        const node = html\`${processedHtml}\`;
        if (!root) {
          root = node;
          marker.replaceWith(node);
        } else {
          root.replaceWith(node);
          root = node;
        }
      }

      effect(() => render());
    }
  `;

  return clientComponentModule.trim();
}

/**
 * Generates HTML template for client component with hydration marker
 * @param {string} componentName
 * @param {string} componentPath
 * @param {object} props
 * @returns {string}
 */
export async function processClientComponent(componentName) {
  const targetId = `client-${componentName}-${Date.now()}`;

  const html = `<template id="${targetId}" data-client:component="${componentName}"></template>`;

  return html;
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
 * Extract default values from vprops definition
 * @param {string} clientCode
 * @returns {object} Object with prop names and their default values
 */
function extractVPropsDefaults(clientCode) {
  const vpropsLiteral = extractVPropsObject(clientCode);
  if (!vpropsLiteral) return {};

  const vpropsDef = safeObjectEval(vpropsLiteral);
  const defaults = {};

  for (const key in vpropsDef) {
    const def = vpropsDef[key];
    if (def && typeof def === "object" && "default" in def) {
      defaults[key] = def.default;
    }
  }

  return defaults;
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

/**
 * Generates all client component JS files in public/components/
 * Scans server/components for .html files with <script client>
 * @returns {Promise<void>}
 */
export async function generateAllClientComponents() {
  const componentsDir = path.resolve(rootPath, "server", "components");
  const pagesDir = path.resolve(rootPath, "pages");
  const outputDir = path.resolve(rootPath, "public", "_app", "components");

  // Ensure output directory exists
  await fs.mkdir(outputDir, { recursive: true });

  // Read all .html files in components and pages directory, go deep 
  const pageFiles = await readDirectoryRecursive(pagesDir);
  const componentFiles = await readDirectoryRecursive(componentsDir);
  

  const htmlFiles = [...pageFiles, ...componentFiles].filter((file) => file.fullpath.endsWith(".html"));

  for (const file of htmlFiles) {

    // Generate JS module
    const moduleCode = await generateClientComponentModule(file.fullpath);

    if(!moduleCode) continue;
    
    const componentName = getComponentNameFromPath(file.fullpath, file.name)

    // Write to public/components/
    const outputPath = path.join(outputDir, `${componentName}.js`);
    await fs.writeFile(outputPath, moduleCode, "utf-8");
  }

  console.log(`Client components generated`);
}
