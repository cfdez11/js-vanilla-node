import { Component } from "../app/services/component.js";
import { defineComponent } from "../app/services/decorators.js";
import { html } from "../app/services/html.js";
import { reactive } from "../app/services/reactive.js";

export class Counter extends Component {
  counter = reactive(parseInt(this.getAttribute("start") || "0"));

  increment() {
    this.counter.value++;
  }

  decrement() {
    this.counter.value--;
  }

  render() {
    return html`
      <div class="flex items-center justify-center gap-4 w-fit">
        <button
          @click="${this.decrement}"
          class="flex items-center justify-center w-10 h-10 bg-red-500 hover:bg-red-600 text-white font-bold rounded-full transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          :disabled="${this.counter.value <= 0}"
        >
          Sub
        </button>

        <div class="flex flex-col items-center gap-2">
          <span
            class="text-4xl font-bold text-gray-800 min-w-[4rem] text-center"
          >
            ${this.counter.value}
          </span>
          <span class="text-sm text-gray-500 uppercase tracking-wide">
            Count
          </span>
        </div>

        <button
          @click="${this.increment}"
          class="flex items-center justify-center w-10 h-10 bg-green-500 hover:bg-green-600 text-white font-bold rounded-full transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
        >
          Add
        </button>

        ${this.counter.value > 0 &&
        html`
          <div
            class="flex items-center gap-1 ml-4 p-2 bg-yellow-50 rounded-lg border border-yellow-200"
          >
            <div class="flex flex-wrap gap-1">
              ${Array.from({
                length: Math.min(this.counter.value, 20),
              }).map(
                () =>
                  html`<span class="text-yellow-500 text-lg animate-pulse"
                    >⭐</span
                  >`
              )}
            </div>
          </div>
        `}
      </div>
    `;
  }
}

defineComponent("counter")(Counter);
