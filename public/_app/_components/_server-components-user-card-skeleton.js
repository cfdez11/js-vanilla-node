import { effect } from '/public/_app/services/reactive.js';
import { html } from '/public/_app/services/html.js';  

    export const metadata = {}
    
    export function hydrateClientComponent(marker) {
      
      
      let root = null;
      function render() {
        const node = html`<div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm animate-pulse">
    <div class="flex items-center space-x-3">
      <div class="shrink-0">
        <div class="w-12 h-12 bg-gray-300 rounded-full"></div>
      </div>
      <div class="flex-1 space-y-2">
        <div class="h-4 bg-gray-300 rounded w-24"></div>
        <div class="h-3 bg-gray-200 rounded w-32"></div>
      </div>
    </div>
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
    }