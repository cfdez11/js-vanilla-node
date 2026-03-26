import { effect } from '/_vexjs/services/reactive.js';
import { html } from '/_vexjs/services/html.js';  

    export const metadata = null
    
    export function hydrateClientComponent(marker, incomingProps = {}) {
      /** @type {{ links: { href: string, label: string }[] }} */
  const props = { ...{"links":[]}, ...incomingProps };
      
      let root = null;
      function render() {
        const node = html`<section class="flex justify-end mt-4">
      ${props.links.map(link => html`<a :href='${link.href}' class="text-blue-600 hover:underline font-medium">
        View ${link.label} Weather →
      </a>`)}
    </section>`;
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