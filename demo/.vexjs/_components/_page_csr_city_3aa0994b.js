import { useRouteParams } from "/_vexjs/services/navigation/index.js"
import { effect } from '/_vexjs/services/reactive.js';
import { html } from '/_vexjs/services/html.js';  

    export const metadata = {"title":"Page CSR","description":"CSR page fetching data in client-side using a client component"}
    
    export function hydrateClientComponent(marker, incomingProps = {}) {
      const params = useRouteParams();
  const cityParam = params.city || "madrid";

  const links = [
    { href: '/page-csr/madrid', label: 'Madrid' },
    { href: '/page-csr/barcelona', label: 'Barcelona' },
    { href: '/page-csr/londres', label: 'Londres' },
    { href: '/page-csr/nuevayork', label: 'Nueva York' },
    { href: '/page-csr/paris', label: 'París' },
    { href: '/page-csr/tokio', label: 'Tokio' },
  ];
      
      let root = null;
      function render() {
        const node = html`<div class="max-w-6xl mx-auto px-4 py-8">
    <header class="mb-12 text-center">
      <div class="inline-block bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
        ⚡ Client-Side Rendering (CSR)
      </div>
      <h1 class="text-4xl font-bold mb-4">Weather Dashboard</h1>
      <p class="text-lg text-gray-600 max-w-2xl mx-auto">
        The page loads immediately and data is fetched dynamically from the
        browser using reactive components.
      </p>
      <div class="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg inline-block">
        <p class="text-sm text-green-800">
          ⚡ <strong>Note:</strong> This page loaded instantly! Data is
          fetched asynchronously on the client after the page renders.
        </p>
      </div>
    </header>
    <template id="client-Weather-1774520188153" data-client:component="_components_weather_weather_params_a4d2cb74" data-client:props='{}'></template>
    <template id="client-WeatherLinks-1774520188153" data-client:component="_components_weather_weather_links_376a02a5" data-client:props='${JSON.stringify({links:links.filter(link => !link.href.includes(cityParam))})}'></template>
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