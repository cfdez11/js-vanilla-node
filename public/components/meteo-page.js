import { Component } from "../app/services/component.js";
import { defineComponent } from "../app/services/decorators.js";
import { html } from "../app/services/html.js";
import "./Weather.js";

export class MeteoPage extends Component {
  render() {
    return html`
        <div class="min-h-screen py-8">
          <div class="max-w-7xl mx-auto px-4">
            <div class="text-center mb-8">
              <h1 class="text-4xl font-bold text-gray-900 mb-4">
                Clima CSR con Open-Meteo
              </h1>
              <p class="text-gray-600 text-lg">
                Datos meteorológicos en tiempo real usando reactividad client-side
              </p>
            </div>
            <c-weather></c-weather>
            </div>
          </div>
        </div>
      </div>
  `;
  }
}

defineComponent("meteo-page")(MeteoPage);
