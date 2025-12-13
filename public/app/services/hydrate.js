/**
 * Client-side hydration script for streaming suspense boundaries
 * This script executes in the browser to replace fallback content with real content
 */
(function () {
  const script = document.currentScript;
  const targetId = script.dataset.target;
  const sourceId = script.dataset.source;

  const target = document.getElementById(targetId);
  const template = document.getElementById(sourceId);

  if (target && template) {
    // Replace the fallback div with the real content from the template
    target.replaceWith(template.content.cloneNode(true));
    template.remove();
  }

  // Clean up the script tag itself
  // script.remove();
})();
