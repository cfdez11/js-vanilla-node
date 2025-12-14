import { effect } from '/public/_app/services/reactive.js';
import { html } from '/public/_app/services/html.js';  

    export const metadata = {"title":"Home","description":"Welcome to the home page"}
    
    export function hydrateClientComponent(marker) {
      
      
      let root = null;
      function render() {
        const node = html`<div class="max-w-6xl mx-auto px-4 py-8">
    <header class="mb-12 text-center">
      <h1 class="text-4xl font-bold mb-4">Server-Side Rendering (SSR) Example</h1>
      <p class="text-lg text-gray-600">This page demonstrates different rendering strategies and component types
        available.</p>
    </header>

    <div class="space-y-12">
      <!-- Server Component (Blocking) -->
      <section class="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
        <h2 class="text-2xl font-semibold mb-3 text-blue-700">1. Server Component (Blocking)</h2>
        <p class="text-gray-700 mb-4">This component is rendered on the server and blocks the initial page load until
          it's ready. All data is fetched before sending HTML to the client:</p>
        ${attributes.map(attribute => html`<div
          class="inline-block bg-gray-200 text-gray-800 px-4 py-1 rounded-full text-sm font-semibold mb-4 mr-2">
          ${attribute}
        </div>`)}
        <div class="bg-blue-50 p-4 rounded">
          <UserCard :userId="${userId}" />
        </div>
      </section>

      <!-- Server Components with Suspense -->
      <section class="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
        <h2 class="text-2xl font-semibold mb-3 text-purple-700">2. Server Components with Suspense (Streaming)</h2>
        <p class="text-gray-700 mb-4">These components use suspense to show a skeleton/fallback immediately while the
          content streams in. The rest of the page loads without waiting:</p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-purple-50 p-4 rounded">
            <Suspense :fallback="${<UserCardSkeleton />}">
              <UserCardDelayed :userId="${userId}" />
            </Suspense>
          </div>
          <div class="bg-purple-50 p-4 rounded">
            <Suspense :fallback="${<UserCardSkeleton />}">
              <UserCardDelayed :userId="${userId}" />
            </Suspense>
          </div>
        </div>
      </section>

      <!-- Client Component -->
      <section class="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
        <h2 class="text-2xl font-semibold mb-3 text-green-700">3. Client Component (Interactive)</h2>
        <p class="text-gray-700 mb-4">This component is hydrated on the client side and provides full interactivity with
          reactive state:</p>
        <div class="bg-green-50 p-4 rounded flex justify-center">
          <template id="client-Counter-1765733539490" data-client:component="_server-components-counter"></template>
        </div>
      </section>

      <!-- Static Content -->
      <section class="bg-white rounded-lg shadow-md p-6 border-l-4 border-gray-500">
        <h2 class="text-2xl font-semibold mb-3 text-gray-700">4. Static Content</h2>
        <p class="text-gray-700 mb-4">This is plain HTML content rendered on the server without any dynamic behavior:
        </p>
        <div class="bg-gray-50 p-4 rounded">
          <p class="text-gray-600">Static content of the page</p>
        </div>
      </section>
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