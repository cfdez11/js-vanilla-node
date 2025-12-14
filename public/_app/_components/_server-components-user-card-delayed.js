import { effect } from '/public/_app/services/reactive.js';
import { html } from '/public/_app/services/html.js';  

    export const metadata = {}
    
    export function hydrateClientComponent(marker) {
      
      
      let root = null;
      function render() {
        const node = html`<div class="user-card bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
    <div class="flex items-center space-x-3">
      <div class="shrink-0">
        <div class="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
          ${userId}
        </div>
      </div>
      <div class="flex-1">
        <div class="font-semibold text-gray-900">${name}</div>
        <div class="text-sm text-gray-500">User ID: ${userId}</div>
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