import { effect } from "./reactive.js";

/**
 * Base class for creating reactive Web Components.
 *
 * Features:
 * - Auto-binds all methods to the component instance
 * - Automatic reactive rendering via effect()
 * - Simplified render lifecycle
 *
 * Usage:
 * ```js
 * class MyComponent extends Component {
 *   counter = reactive(0);
 *
 *   increment() {
 *     this.counter.value++;
 *   }
 *
 *   render() {
 *     return html`<button @click="${this.increment}">${this.counter.value}</button>`;
 *   }
 * }
 * customElements.define("my-component", MyComponent);
 * ```
 */
export class Component extends HTMLElement {
  constructor() {
    super();

    // Auto-bind all methods to this instance
    this._autoBindMethods();

    // Defer effect setup until after child constructor completes
    queueMicrotask(() => {
      if (this.render) {
        effect(() => this._render());
      }
    });
  }

  /**
   * Auto-binds all methods from the prototype chain to `this`.
   * Excludes constructor and lifecycle methods from HTMLElement.
   */
  _autoBindMethods() {
    const excludedMethods = new Set([
      "constructor",
      "connectedCallback",
      "disconnectedCallback",
      "adoptedCallback",
      "attributeChangedCallback",
      "render",
      "_render",
      "_autoBindMethods",
    ]);

    // Get all methods from the prototype chain (excluding HTMLElement and above)
    let proto = Object.getPrototypeOf(this);

    while (proto && proto !== HTMLElement.prototype) {
      for (const key of Object.getOwnPropertyNames(proto)) {
        if (excludedMethods.has(key)) continue;

        const descriptor = Object.getOwnPropertyDescriptor(proto, key);
        if (descriptor && typeof descriptor.value === "function") {
          this[key] = this[key].bind(this);
        }
      }
      proto = Object.getPrototypeOf(proto);
    }
  }

  /**
   * Internal render method that handles DOM updates
   */
  _render() {
    if (this.render) {
      const content = this.render();
      this.innerHTML = "";
      if (content) {
        this.appendChild(content);
      }
    }
  }
}
