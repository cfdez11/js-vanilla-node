/**
 * Decorator factory for registering Web Components with automatic naming convention.
 *
 * Automatically prefixes component names with 'c-' to follow component naming standards.
 * This helps distinguish custom components from native HTML elements.
 *
 * @param {string} name - The component name (without prefix). Will be prefixed with 'c-'
 * @returns {function} Decorator function that registers the component class
 *
 * Usage:
 * ```js
 * class CustomComponent extends Component {
 *   render() {
 *     return html`<div>Custom component</div>`;
 *   }
 * }
 * defineComponent("component")(CustomComponent);
 */
export function defineComponent(name) {
  return function (ClassConstructor) {
    customElements.define(`c-${name}`, ClassConstructor);
    return ClassConstructor;
  };
}
