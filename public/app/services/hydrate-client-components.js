/**
 * Hydrates a single component marker
 */
async function hydrateMarker(marker) {
  if (marker.dataset.hydrated === "true") return;

  const componentName = marker.getAttribute("data-client:component");

  try {
    const module = await import(`/public/components/${componentName}.js`);
    module.hydrateClientComponent(marker);
    marker.dataset.hydrated = "true";
  } catch (error) {
    console.error(`Failed to load component: ${componentName}`, error);
  }
}

/**
 * Hydrates all component markers
 */
async function hydrateComponents(container = document) {
  const markers = container.querySelectorAll(
    "[data-client\\:component]:not([data-hydrated='true'])"
  );

  for (const marker of markers) {
    await hydrateMarker(marker);
  }
}

// Enable observer only if page has streaming markers
console.warn(
  "  Checking for client components to hydrate...,",
  document.readyState
);

// observe DOM changes to hydrate dynamically added components
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === 1) {
        if (node.matches?.("[data-client\\:component]")) {
          hydrateMarker(node);
        }
        const markers = node.querySelectorAll?.(
          '[data-client\\:component]:not([data-hydrated="true"])'
        );
        markers?.forEach(hydrateMarker);
      }
    });
  });
});

// start observing the document for added nodes until DOMContentLoaded
observer.observe(document, { childList: true, subtree: true });

// hydrate on DOMContentLoaded and unobserve after that
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    hydrateComponents();
    observer.disconnect();
  });
} else {
  hydrateComponents();
  observer.disconnect();
}
