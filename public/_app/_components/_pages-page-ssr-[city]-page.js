import { effect } from '/public/_app/services/reactive.js';
import { html } from '/public/_app/services/html.js';  

    export const metadata = {"title":"Weather ISR - Server Side Rendering","description":"Weather page with Server-Side Rendering. All data is loaded on the server before sending the page to the client.","revalidate":60}
    
    export function hydrateClientComponent(marker) {
      
      
      let root = null;
      function render() {
        const node = html`<div class="max-w-6xl mx-auto px-4 py-8">
    <header class="mb-12 text-center">
      <div class="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
        🖥️ Incremental Static Regeneration (ISR)
      </div>
      <h1 class="text-4xl font-bold mb-4">Weather Dashboard</h1>
      <p class="text-lg text-gray-600 max-w-2xl mx-auto">
        All weather data is fetched on the server before the page is sent to your browser.
      </p>
      <div class="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg inline-block">
        <p class="text-sm text-yellow-800">
          ⏱️ <strong>Note:</strong> This page is dynamic and isr. The content will be revalidated in 10 seconds, during this time will serve the same data
        </p>
      </div>
    </header>

    <section class="space-y-8">
      <!-- Header del Clima -->
      <div class="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-3xl font-bold mb-2">🌤️ Weather in ${location.name}</h2>
            <p class="text-blue-100">Data loaded from server (simulated API delay)</p>
          </div>
          <div class="text-right">
            <div class="text-5xl font-bold">${current.temperature}°C</div>
            <div class="text-blue-200">Feels like: ${current.apparentTemperature}°C</div>
          </div>
        </div>
      </div>

      <!-- Current Weather -->
      <div>
        <h3 class="text-xl font-bold text-gray-800 mb-4">Current Weather</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div class="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-gray-600 text-sm font-medium">Temperature</p>
                <p class="text-2xl font-bold text-gray-800">${current.temperature}°C</p>
              </div>
              <div class="text-3xl">🌡️</div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-gray-600 text-sm font-medium">Humidity</p>
                <p class="text-2xl font-bold text-gray-800">${current.humidity}%</p>
              </div>
              <div class="text-3xl">💧</div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-gray-600 text-sm font-medium">Wind</p>
                <p class="text-2xl font-bold text-gray-800">${current.windSpeed} km/h</p>
              </div>
              <div class="text-3xl">💨</div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-gray-600 text-sm font-medium">Precipitation</p>
                <p class="text-2xl font-bold text-gray-800">${current.precipitation} mm</p>
              </div>
              <div class="text-3xl">🌧️</div>
            </div>
          </div>
        </div>
      </div>
    </section>
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