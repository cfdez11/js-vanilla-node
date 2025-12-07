import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const suspenseRegex = /<suspense\s+fallback="([^"]*)">([\s\S]*?)<\/suspense>/g;
const serverElementRegex = /<(s-[a-z0-9-]+)\s*([^>]*)><\/\1>/g;

/**
 * Parses raw attribute string into an object
 * @param {string} raw
 * @returns {Object<string, string>} Parsed attributes
 */
function parseAttributes(raw) {
  const attrs = {};
  const regex = /([a-zA-Z0-9_-]+)="([^"]*)"/g;
  let match;
  while ((match = regex.exec(raw))) {
    attrs[match[1]] = match[2];
  }
  return attrs;
}

/**
 * Renders a single server component
 * @param {string} tag
 * @param {Object<string, string>} attrs
 * @returns {Promise<string>} Rendered HTML
 */
async function renderServerComponent(tag, attrs) {
  const componentName = tag.substring(2); // remove 's-' prefix
  const modulePath = path.resolve(
    __dirname,
    "../components",
    `${componentName}.js`
  );
  const componentModule = await import(pathToFileURL(modulePath).href);
  return await componentModule.default(attrs);
}

/**
 * Renders server components that are NOT inside suspense boundaries
 * @param {string} html
 * @returns {Promise<string>} HTML with non-suspended server components rendered
 */
export async function renderNonSuspendedComponents(html) {
  // First, temporarily replace suspense blocks (including the component) with placeholders to avoid loading them
  const suspenseBlocks = [];
  let tempHtml = html.replace(suspenseRegex, (match) => {
    const index = suspenseBlocks.length;
    suspenseBlocks.push(match);
    return `<!--SUSPENSE_PLACEHOLDER_${index}-->`;
  });

  // Now render server components outside suspense
  let serverMatch;
  serverElementRegex.lastIndex = 0;
  while ((serverMatch = serverElementRegex.exec(tempHtml)) !== null) {
    const tag = serverMatch[1];
    const rawAttrs = serverMatch[2];
    const attrs = parseAttributes(rawAttrs);
    const rendered = await renderServerComponent(tag, attrs);
    tempHtml = tempHtml.replace(serverMatch[0], rendered);
    serverElementRegex.lastIndex = 0; // Reset regex after replacement
  }

  // Restore suspense blocks
  suspenseBlocks.forEach((block, index) => {
    tempHtml = tempHtml.replace(`<!--SUSPENSE_PLACEHOLDER_${index}-->`, block);
  });

  return tempHtml;
}

/**
 * Extracts suspense boundaries and returns initial HTML with fallbacks
 * @param {string} html
 * @returns {Promise<{
 *  initialHtml: string,
 *  suspenseComponents: Array<{
 *    id: string,
 *    content: string,
 *    serverComponents: Array<{
 *      tag: string,
 *      attrs: Object<string, string>,
 *      fullMatch: string
 *    }>
 *  }>
 * }>} Extracted suspense components and initial HTML
 */
export async function extractSuspenseBoundaries(html) {
  const suspenseComponents = [];
  let suspenseId = 0;
  const replacements = [];

  // First pass: collect all suspense matches
  let match;
  while ((match = suspenseRegex.exec(html)) !== null) {
    replacements.push({
      fullMatch: match[0],
      fallback: match[1],
      content: match[2],
    });
  }

  // Process each suspense
  let initialHtml = html;
  for (const replacement of replacements) {
    const id = `suspense-${suspenseId++}`; // todo: use id generator or hash
    let fallbackHtml = replacement.fallback;

    // Render server components in fallback
    let componentMatch;
    serverElementRegex.lastIndex = 0;
    while ((componentMatch = serverElementRegex.exec(fallbackHtml)) !== null) {
      const tag = componentMatch[1];
      const attrs = parseAttributes(componentMatch[2]);
      const rendered = await renderServerComponent(tag, attrs);
      fallbackHtml = fallbackHtml.replace(componentMatch[0], rendered);
      serverElementRegex.lastIndex = 0;
    }

    // Find server components inside this suspense content
    const serverComponents = [];
    serverElementRegex.lastIndex = 0;
    while (
      (componentMatch = serverElementRegex.exec(replacement.content)) !== null
    ) {
      serverComponents.push({
        tag: componentMatch[1],
        attrs: parseAttributes(componentMatch[2]),
        fullMatch: componentMatch[0],
      });
    }

    suspenseComponents.push({
      id,
      content: replacement.content,
      serverComponents,
    });

    // Replace suspense with container having the rendered fallback
    initialHtml = initialHtml.replace(
      replacement.fullMatch,
      `<div id="${id}">${fallbackHtml}</div>`
    );
  }

  return { initialHtml, suspenseComponents };
}

/**
 * Generates the streaming replacement using template + external script
 * @param {string} suspenseId ID of the suspense boundary
 * @param {string} renderedContent Rendered HTML content to replace fallback
 */
export function generateReplacementContent(suspenseId, renderedContent) {
  const contentId = `${suspenseId}-content`;

  return `<template id="${contentId}">${renderedContent}</template><script src="/public/app/services/hydrate.js" data-target="${suspenseId}" data-source="${contentId}" async></script>`;
}

/**
 * Renders all server components inside a suspense boundary
 * @param {{
 *  id: string,
 *  content: string,
 *  serverComponents: Array<{
 *    tag: string,
 *    attrs: Object<string, string>,
 *    fullMatch: string
 *  }>
 * }} suspenseComponent Suspense component data
 * @returns {Promise<string>} Rendered HTML content
 */
export async function renderSuspenseContent(suspenseComponent) {
  let content = suspenseComponent.content;

  for (const component of suspenseComponent.serverComponents) {
    const rendered = await renderServerComponent(
      component.tag,
      component.attrs
    );
    content = content.replace(component.fullMatch, rendered);
  }

  return content.trim();
}
