import { effect } from '/_vexjs/services/reactive.js';
import { html } from '/_vexjs/services/html.js';  

    export const metadata = null
    
    export function hydrateClientComponent(marker, incomingProps = {}) {
      /** @type {{ children: node }} */
  const props = { ...{"children":null}, ...incomingProps };

  console.warn('LAYOUT STATIC RENDERED');
      
      let root = null;
      function render() {
        const node = html`<div class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="bg-white rounded-lg border border-gray-200 p-6 min-h-[60vh]">
      ${props.children}
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

      return root;
    }