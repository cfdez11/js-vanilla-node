// Hydrates a single component marker
async function hydrateMarker(marker) {
  if (marker.dataset.hydrated === "true") return;

  const componentName = marker.getAttribute("data-client:component");

  try {
    const module = await import(`/public/_app/components/${componentName}.js`);
    module.hydrateClientComponent(marker);
    marker.dataset.hydrated = "true";
  } catch (error) {
    console.error(`Failed to load component: ${componentName}`, error);
  }
}

// Hydrates all component markers
async function hydrateComponents(container = document) {
  const markers = container.querySelectorAll(
    "[data-client\\:component]:not([data-hydrated='true'])"
  );

  for (const marker of markers) {
    await hydrateMarker(marker);
  }
}

/**
  Important: use observer before DOMContentLoaded because if the page response is not ended because there are streaming components, the document might not fire DOMContentLoaded event. So we need to observe from the start to hydrate client components as they are added.
 **/ 
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
  });
} else {
  hydrateComponents();
}
