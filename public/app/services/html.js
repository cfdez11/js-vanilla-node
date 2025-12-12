/**
 * Tagged template literal to create HTML elements.
 *
 * Supported syntax:
 *
 * 1. Text interpolation:
 *    html`<span>${value}</span>`
 *
 * 2. Attribute interpolation:
 *    html`<div class="${className}" id="${id}"></div>`
 *
 * 3. Event bindings (@event):
 *    html`<button @click="${handler}">Click</button>`
 *    html`<input @input="${onInput}" @change="${onChange}">`
 *
 * 4. Property/Boolean bindings (:prop):
 *    - Boolean values toggle attribute presence:
 *      html`<button :disabled="${isDisabled}">Send</button>`
 *      html`<div :hidden="${!visible}">Content</div>`
 *    - Other values set the property directly:
 *      html`<input :value="${text}">`
 *      html`<select :selectedIndex="${index}">`
 *
 * 5. Nested templates:
 *    html`<div>${condition ? html`<span>Yes</span>` : html`<span>No</span>`}</div>`
 *
 * 6. Array rendering:
 *    html`<ul>${items.map(item => html`<li>${item}</li>`)}</ul>`
 *
 */
export function html(strings, ...values) {
  // Unique markers to identify interpolated values
  const markers = values.map((_, i) => `__HTML_MARKER_${i}__`);

  // Build the HTML with markers
  let htmlString = strings[0];
  for (let i = 0; i < values.length; i++) {
    htmlString += markers[i] + strings[i + 1];
  }

  // Create a template to parse the HTML
  const template = document.createElement("template");
  template.innerHTML = htmlString.trim();

  const fragment = template.content.cloneNode(true);

  // Process the fragment and replace markers
  processNode(fragment, markers, values);

  return fragment.childElementCount === 1
    ? fragment.firstElementChild
    : fragment;
}

/**
 * Process a node and its children to replace markers with actual values
 * @param {HTMLNode} node
 * @param {string[]} markers
 * @param {any[]} values
 * @returns {void}
 */
function processNode(node, markers, values) {
  // Process text nodes
  if (node.nodeType === Node.TEXT_NODE) {
    processTextNode(node, markers, values);
    return;
  }

  // Process attributes if it's an element
  if (node.nodeType === Node.ELEMENT_NODE) {
    processAttributes(node, markers, values);
  }

  // Process children recursively
  const children = Array.from(node.childNodes);
  for (const child of children) {
    processNode(child, markers, values);
  }
}

/**
 * Process text nodes, replacing markers with values
 * @param {HTMLElement} node
 * @param {string[]} markers
 * @param {any[]} values
 * @return {void}
 */
function processTextNode(node, markers, values) {
  let text = node.textContent;
  let hasMarker = false;

  for (let i = 0; i < markers.length; i++) {
    if (text.includes(markers[i])) {
      hasMarker = true;
      const value = values[i];

      // If the value is a DocumentFragment or Node, we need to replace the node
      if (value instanceof Node) {
        const parts = text.split(markers[i]);
        const parent = node.parentNode;

        // Create text node before
        if (parts[0]) {
          parent.insertBefore(document.createTextNode(parts[0]), node);
        }

        // if it's a DocumentFragment, move its children
        if (value instanceof DocumentFragment) {
          while (value.firstChild) {
            parent.insertBefore(value.firstChild, node);
          }
        } else {
          parent.insertBefore(value.cloneNode(true), node);
        }

        // Update remaining text
        text = parts.slice(1).join(markers[i]);
        node.textContent = text;
      }
      // If it's an array, process each element
      else if (Array.isArray(value)) {
        const parts = text.split(markers[i]);
        const parent = node.parentNode;

        if (parts[0]) {
          parent.insertBefore(document.createTextNode(parts[0]), node);
        }

        for (const item of value) {
          if (item instanceof DocumentFragment) {
            // ✅ CAMBIO: Mover hijos del fragment (no clonar)
            while (item.firstChild) {
              parent.insertBefore(item.firstChild, node);
            }
          } else if (item instanceof Node) {
            parent.insertBefore(item.cloneNode(true), node);
          } else {
            parent.insertBefore(
              document.createTextNode(String(item ?? "")),
              node
            );
          }
        }

        text = parts.slice(1).join(markers[i]);
        node.textContent = text;
      }
      // Primitive value
      else {
        text = text.replace(markers[i], value ?? "");
      }
    }
  }

  if (hasMarker) {
    node.textContent = text;
  }
}

/**
 * Process element attributes, handling special bindings
 * @param {HTMLElement} element
 * @param {string[]} markers
 * @param {any[]} values
 * @returns {void}
 */
function processAttributes(element, markers, values) {
  const attributesToRemove = [];
  const attributesToProcess = Array.from(element.attributes);

  // for each attribute, check for special bindings
  for (const attr of attributesToProcess) {
    const name = attr.name;
    const value = attr.value;

    // Event binding: @click, @input, etc.
    if (name.startsWith("@")) {
      const eventName = name.slice(1);
      const markerIndex = markers.findIndex((m) => value.includes(m));

      if (markerIndex !== -1) {
        const handler = values[markerIndex];
        if (typeof handler === "function") {
          element.addEventListener(eventName, handler);
        }
      }
      attributesToRemove.push(name);
    }

    // Property/Boolean binding: :value, :checked, :disabled, etc.
    else if (name.startsWith(":")) {
      const propName = name.slice(1);
      const markerIndex = markers.findIndex((m) => value.includes(m));

      if (markerIndex !== -1) {
        const propValue = values[markerIndex];

        // If boolean, treat as boolean attribute
        if (typeof propValue === "boolean") {
          if (propValue) {
            element.setAttribute(propName, "");
          } else {
            element.removeAttribute(propName);
          }
        }
        // Otherwise, set as property
        else {
          element[propName] = propValue;
        }
      }
      attributesToRemove.push(name);
    }
    // Regular attribute with interpolated value
    else {
      let newValue = value;
      for (let i = 0; i < markers.length; i++) {
        if (newValue.includes(markers[i])) {
          newValue = newValue.replace(markers[i], values[i] ?? "");
        }
      }
      if (newValue !== value) {
        element.setAttribute(name, newValue);
      }
    }
  }

  // remove processed special attributes
  for (const name of attributesToRemove) {
    element.removeAttribute(name);
  }
}
