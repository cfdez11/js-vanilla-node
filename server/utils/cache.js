const store = new Map();

export function getCachedComponentHtml({ componentPath, revalidateSeconds = 0 }) {
  const entry = store.get(componentPath);

  if (!entry) {
    return { html: null };
  }

  const isStale =
    Date.now() - entry.generatedAt > revalidateSeconds * 1000;

  return { html: entry.html, isStale };
}

export function setCachedComponentHtml({ componentPath, html }) {
  store.set(componentPath, {
    html,
    generatedAt: Date.now()
  });
}
