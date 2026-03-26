import { effect } from '/_vexjs/services/reactive.js';
import { html } from '/_vexjs/services/html.js';  

    export const metadata = {"title":"Static page","description":"Static without data fetching. This page is pre-rendered at build time."}
    
    export function hydrateClientComponent(marker, incomingProps = {}) {
      
      
      let root = null;
      function render() {
        const node = html`<div class="max-w-6xl mx-auto px-4 py-8">
    <header class="mb-12 text-center">
      <h1 class="text-4xl font-bold mb-4">Static page</h1>
      <p class="text-lg text-gray-600">This page is static and was not generated with data fetching.</p>
      <p class="text-lg text-gray-600">This page is contained in a custom layout </p>
    </header>
  </div>`;
        if (!root) {
          root = node;
          marker.replaceWith(node);
        } else {
          root.replaceWith(node);
          root = node;
        }
      }

      effect(() => render());

      return root;
    }