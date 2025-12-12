import {
  processClientComponent,
  renderHtmlFile,
} from "./component-processor.js";

// processNode of compileTemplateToHTML remove binding characters (:)
const suspenseRegex = /<Suspense\s+fallback="([^"]*)">([\s\S]*?)<\/Suspense>/g;

/**
 * Parses raw attribute string into an object
 * @param {string} raw
 * @returns {Object<string, string>}
 */
function parseAttributes(raw) {
  const attrs = {};
  const regex = /([a-zA-Z0-9_:-]+)="([^"]*)"/g;
  let match;
  while ((match = regex.exec(raw))) {
    attrs[match[1]] = match[2];
  }
  return attrs;
}

/**
 * Renders components in HTML
 * @param {string} html
 * @param {Map<string, { path: string }>} serverComponents
 * @returns {Promise<string>}
 */
async function processServerComponents(html, serverComponents) {
  let processedHtml = html;
  const allMatches = [];

  for (const [componentName, componentData] of serverComponents.entries()) {
    const escapedName = componentName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const componentRegex = new RegExp(
      `<${escapedName}(?![a-zA-Z0-9_-])\\s*([^>]*?)\\s*(?:\\/>|>\\s*<\\/${escapedName}(?![a-zA-Z0-9_-])>)`,
      "gi"
    );

    const replacements = [];
    let match;

    while ((match = componentRegex.exec(html)) !== null) {
      const matchData = {
        name: componentName,
        attrs: parseAttributes(match[1]),
        fullMatch: match[0],
        start: match.index,
        end: match.index + match[0].length,
      };

      replacements.push(matchData);
      allMatches.push(matchData);
    }

    // Render in reverse order to maintain indices
    for (let i = replacements.length - 1; i >= 0; i--) {
      const { start, end, attrs } = replacements[i];
      const { html: htmlComponent } = await renderHtmlFile(
        componentData.path,
        attrs
      );
      processedHtml =
        processedHtml.slice(0, start) +
        htmlComponent +
        processedHtml.slice(end);
    }
  }

  return processedHtml;
}

const cleanClientComponentPath = (path) => {
  const normalized = path.replace(/\\/g, "/");
  const idx = normalized.indexOf("/public");

  if (idx === -1) return normalized;

  return normalized.substring(idx);
};

/**
 * Renders components in HTML and client scripts to load them
 * @param {string} html
 * @param {Map<string, { path: string }>} clientComponents
 * @returns {Promise<{
 *  html: string,
 *  allScripts: Array<string>,
 * }>}
 */
async function renderClientComponents(html, clientComponents) {
  let processedHtml = html;
  const allMatches = [];
  const allScripts = [];

  for (const [componentName, componentData] of clientComponents.entries()) {
    const escapedName = componentName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const componentRegex = new RegExp(
      `<${escapedName}(?![a-zA-Z0-9_-])\\s*([^>]*?)\\s*(?:\\/>|>\\s*<\\/${escapedName}(?![a-zA-Z0-9_-])>)`,
      "gi"
    );

    const replacements = [];
    let match;

    while ((match = componentRegex.exec(html)) !== null) {
      const matchData = {
        name: componentName,
        attrs: parseAttributes(match[1]),
        fullMatch: match[0],
        start: match.index,
        end: match.index + match[0].length,
      };

      replacements.push(matchData);
      allMatches.push(matchData);
    }

    // Render in reverse order to maintain indices
    for (let i = replacements.length - 1; i >= 0; i--) {
      const { start, end } = replacements[i];

      const htmlComponent = await processClientComponent(componentName);

      processedHtml =
        processedHtml.slice(0, start) +
        htmlComponent +
        processedHtml.slice(end);
    }
  }

  return { html: processedHtml, allScripts };
}

/**
 * Renders server components, handling both regular and suspense boundaries
 * Server components without suspense are rendered immediately.
 * Server components inside <Suspense> boundaries are saved in suspenseComponents.
 * @param {string} pageHtml
 * @param {Map<string, { path: string }>} serverComponents
 * @returns {Promise<{
 *   html: string,
 *   suspenseComponents: Array<{
 *     id: string,
 *     content: string,
 *   }>
 * }>}
 */
async function renderServerComponents(pageHtml, serverComponents = new Map()) {
  const suspenseComponents = [];
  let suspenseId = 0;
  let html = pageHtml;

  // Process suspense boundaries one by one (not in reverse)
  let match;
  suspenseRegex.lastIndex = 0;

  while ((match = suspenseRegex.exec(html)) !== null) {
    const id = `suspense-${suspenseId++}`;
    const [fullMatch, fallback, content] = match;

    // Render components in fallback
    const fallbackHtml = await processServerComponents(
      fallback,
      serverComponents
    );

    suspenseComponents.push({
      id,
      content: content,
    });

    // Replace suspense block with container
    const replacement = `<div id="${id}">${fallbackHtml}</div>`;
    html = html.replace(fullMatch, replacement);
    // Reset regex to search from the beginning since we modified the string
    suspenseRegex.lastIndex = 0;
  }

  // Render all non-suspended components
  html = await processServerComponents(html, serverComponents);

  return { html, suspenseComponents };
}

/**
 * Renders server components, client components in HTML, suspense components and client scripts to load client components
 * @param {{
 *  pageHtml: string,
 *  serverComponents: Map<string, { path: string, originalPath: string, importStatement: string }>,
 *  clientComponents: Map<string, { path: string, originalPath: string, importStatement: string }>,
 * }}
 * @returns {Promise<{
 *   html: string,
 *   clientComponentsScripts: Array<string>,
 *   suspenseComponents: Array<{
 *    id: string,
 *    content: string,
 *   }>
 * }>}
 */
export async function renderComponents({
  html,
  serverComponents = new Map(),
  clientComponents = new Map(),
}) {
  const { html: htmlServerComponents, suspenseComponents } =
    await renderServerComponents(html, serverComponents);

  const { html: htmlClientComponents, allScripts: clientComponentsScripts } =
    await renderClientComponents(htmlServerComponents, clientComponents);

  return {
    html: htmlClientComponents,
    suspenseComponents,
    clientComponentsScripts,
  };
}

/**
 * Generates streaming replacement content for a suspense component
 * Note: needs script to hydrate the content on the client side
 * @param {string} suspenseId
 * @param {string} renderedContent
 * @returns {string}
 */
export function generateReplacementContent(suspenseId, renderedContent) {
  const contentId = `${suspenseId}-content`;
  return `<template id="${contentId}">${renderedContent}</template><script src="/public/app/services/hydrate.js" data-target="${suspenseId}" data-source="${contentId}" defer></script>`;
}

/**
 * Renders all components inside a suspense boundary
 * @param {{
 *   id: string,
 *   content: string,
 *   components: Array<{name: string, attrs: object, fullMatch: string}>
 * }} suspenseComponent
 * @param {Map<string, { path: string }>} serverComponents
 * @returns {Promise<string>}
 */
export async function renderSuspenseComponent(
  suspenseComponent,
  serverComponents
) {
  const html = await processServerComponents(
    suspenseComponent.content,
    serverComponents
  );

  return html;
}
