import { reactive, computed, effect } from "/public/app/services/reactive.js"
import { html } from '/public/app/services/html.js';  

    export function hydrateClientComponent(marker) {
      /** @type {{ start: string }} */
  const props = {"start":10};

  const counter = reactive(props.start);

  function increment () {
    counter.value++;
  }

  function decrement () {
    counter.value--;
  }


  const stars = computed(() => Array.from({ length: counter.value }, () => "⭐"));
      
      let root = null;
      function render() {
        const node = html`<div class="flex items-center justify-between gap-4 w-full">
    <div class="flex items-center gap-6">
      <button @click="${decrement}"
        class="flex items-center justify-center w-10 h-10 bg-red-500 hover:bg-red-600 text-white font-bold rounded-full transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        :disabled="${counter.value <= 0}">
        Sub
      </button>

      <div class="flex flex-col items-center gap-2">
        <span class="text-4xl font-bold text-gray-800 min-w-[4rem] text-center">
          ${counter.value}
        </span>
        <span class="text-sm text-gray-500 uppercase tracking-wide">
          Count
        </span>
      </div>

      <button @click="${increment}"
        class="flex items-center justify-center w-10 h-10 bg-green-500 hover:bg-green-600 text-white font-bold rounded-full transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 cursor-pointer">
        Add
      </button>
    </div>

    <div :hidden="${!(counter.value)}" class="flex items-center gap-1 ml-auto p-2 bg-yellow-50 rounded-lg border border-yellow-200">
      <div class="flex flex-wrap gap-1">
        ${stars.value.map(star => html`<span class="text-yellow-500 text-lg">⭐</span>`)}
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