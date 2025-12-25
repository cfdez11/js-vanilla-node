/**
 * Streams and renders a server-side rendered (SSR) page into the DOM.
 *
 * This function progressively updates the `<main>` element, `<template>` elements,
 * `<script>` tags, and metadata while reading the response stream.
 *
 * @param {string} path - The URL or path of the SSR page to fetch.
 * @param {AbortSignal} signal - AbortSignal to cancel the fetch if needed.
 * @throws {Error} If the response body is not readable.
 */
export async function renderSSRPage(path, signal) {
  const res = await fetch(path, { signal });
  if (!res.body) throw new Error("Invalid SSR response");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  const parser = new DOMParser();

  let buffer = "";
  const main = document.querySelector("main");

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    buffer = processSSRMain(buffer, parser, main);
    buffer = processSSRTemplates(buffer, parser);
    buffer = processSSRScripts(buffer, parser);
    updateSSRMetadata(buffer, parser);

    hydrateComponents(); // global hydration function
  }
}

/**
 * Extracts and renders the `<main>` element from an HTML buffer.
 *
 * @param {string} buffer - The HTML buffer.
 * @param {DOMParser} parser - DOMParser instance.
 * @param {HTMLElement|null} mainEl - Existing <main> element in the DOM.
 * @returns {string} The remaining buffer after processing the <main> tag.
 */
function processSSRMain(buffer, parser, mainEl) {
  const match = buffer.match(/<main[\s\S]*?<\/main>/i);
  if (!match) return buffer;

  const doc = parser.parseFromString(match[0], "text/html");
  const newMain = doc.querySelector("main");

  if (newMain && mainEl) {
    mainEl.innerHTML = newMain.innerHTML;
  }

  return buffer.slice(match.index + match[0].length);
}

/**
 * Processes <script> elements from an HTML buffer, executes inline scripts,
 * and injects external scripts into the DOM if they don't exist yet.
 *
 * @param {string} buffer - The HTML buffer.
 * @param {DOMParser} parser - DOMParser instance.
 * @returns {string} Remaining buffer after processing <script> tags.
 */
function processSSRScripts(buffer, parser) {
  const regex = /<script[\s\S]*?<\/script>/gi;
  let match;

  while ((match = regex.exec(buffer))) {
    const script = parser
      .parseFromString(match[0], "text/html")
      .querySelector("script");

    if (!script) continue;

    if (script.src) {
      const exists = [...document.scripts].some((s) => s.src === script.src);
      if (!exists) {
        const s = document.createElement("script");
        s.src = script.src;
        s.async = true;
        document.head.appendChild(s);
      }
    } else {
      try {
        new Function(script.textContent)();
      } catch (e) {
        console.error("Error executing inline SSR script:", e);
      }
    }
  }

  const end = buffer.lastIndexOf("</script>");
  return end !== -1 ? buffer.slice(end + 9) : buffer;
}

/**
 * Updates the document `<title>` and `<meta name="description">` based on
 * content found in the HTML buffer.
 *
 * @param {string} buffer - The HTML buffer.
 * @param {DOMParser} parser - DOMParser instance.
 */
function updateSSRMetadata(buffer, parser) {
  const doc = parser.parseFromString(buffer, "text/html");

  const title = doc.querySelector("title");
  if (title) document.title = title.textContent;

  const desc = doc.querySelector('meta[name="description"]');
  if (desc) {
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    meta.content = desc.content;
  }
}
