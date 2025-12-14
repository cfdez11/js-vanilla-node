import { effect } from '/public/_app/services/reactive.js';
import { html } from '/public/_app/services/html.js';  

    export const metadata = {}
    
    export function hydrateClientComponent(marker) {
      
      
      let root = null;
      function render() {
        const node = html`<div class="user-card">
    <strong>Usuario:</strong> ${id}
    <div>Nombre: ${name}</div>
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