import { parseDocument, DomUtils } from "htmlparser2";
import { render } from "dom-serializer";

/**
 * return value by evaluating it against provided data
 * @param {string} expression
 * @param {object} scope
 * @returns {any}
 */
function getDataValue(expression, scope) {
  try {
    return Function(
      ...Object.keys(scope),
      `return (${expression})`
    )(...Object.values(scope));
  } catch (e) {
    return "";
  }
}

/**
 * Checks if a DOM node is an empty text node
 * @param {ChildNode} node
 * @returns {boolean}
 */
function isEmptyTextNode(node) {
  return node.type === "text" && /^\s*$/.test(node.data);
}

/**
 * Processes an HTML file to extract script, template, metadata, client code, and component registry
 * @param {ChildNode} node
 * @param {Object} scope
 * @param {boolean} previousRendered
 * @returns {ChildNode | ChildNode[] | null}
 */
function processNode(node, scope, previousRendered = false) {
  if (node.type === "text") {
    node.data = node.data.replace(/\{\{(.+?)\}\}/g, (_, expr) =>
      getDataValue(expr.trim(), scope)
    );
    return node;
  }

  if (node.type === "tag") {
    const attrs = node.attribs || {};

    for (const [attrName, attrValue] of Object.entries(attrs)) {
      if (typeof attrValue === "string") {
        attrs[attrName] = attrValue.replace(/\{\{(.+?)\}\}/g, (_, expr) =>
          getDataValue(expr.trim(), scope)
        );
      }
    }

    if ("v-if" in attrs) {
      const show = getDataValue(attrs["v-if"], scope);
      delete attrs["v-if"];
      if (!show) return null;
    }

    if ("v-else-if" in attrs) {
      const show = getDataValue(attrs["v-else-if"], scope);
      delete attrs["v-else-if"];
      if (previousRendered || !show) return null;
    }

    if ("v-else" in attrs) {
      delete attrs["v-else"];
      if (previousRendered) {
        return null;
      }
    }

    if ("v-show" in attrs) {
      const show = getDataValue(attrs["v-show"], scope);
      delete attrs["v-show"];
      if (!show) {
        attrs.style = (attrs.style || "") + "display:none;";
      }
    }

    if ("v-for" in attrs) {
      const exp = attrs["v-for"];
      delete attrs["v-for"];

      // format: item in items
      const match = exp.match(/(.+?)\s+in\s+(.+)/);
      if (!match) throw new Error("Invalid v-for format: " + exp);

      const itemName = match[1].trim();
      const listExpr = match[2].trim();
      const list = getDataValue(listExpr, scope);

      if (!Array.isArray(list)) return null;

      const clones = [];

      for (const item of list) {
        const cloned = structuredClone(node);
        const newScope = { ...scope, [itemName]: item };
        clones.push(processNode(cloned, newScope));
      }

      return clones;
    }

    for (const [name, value] of Object.entries({ ...attrs })) {
      if (name.startsWith(":")) {
        const isSuspenseFallback =
          name === ":fallback" && node.name === "Suspense";
        const realName = name.slice(1);
        attrs[realName] = !isSuspenseFallback
          ? String(getDataValue(value, scope))
          : value;
        delete attrs[name];
      }

      if (name.startsWith("v-bind:")) {
        const realName = name.slice(7);
        attrs[realName] = String(getDataValue(value, scope));
        delete attrs[name];
      }
    }

    for (const [name] of Object.entries({ ...attrs })) {
      if (name.startsWith("@") || name.startsWith("v-on:")) {
        delete attrs[name];
      }
    }

    if (node.children) {
      const result = [];
      let isPreviousRendered = false;
      for (const child of node.children) {
        if (isEmptyTextNode(child)) {
          continue;
        }
        const processed = processNode(child, scope, isPreviousRendered);
        if (Array.isArray(processed)) {
          result.push(...processed);
          isPreviousRendered = processed.length > 0;
        } else if (processed) {
          result.push(processed);
          isPreviousRendered = true;
        } else {
          isPreviousRendered = false;
        }
      }
      node.children = result;
    }

    return node;
  }

  return node;
}

/**
 * Renders HTML template content with provided data
 * @param {string} templateContent
 * @param {{
 *  [name: string]: string,
 *  clientScripts?: string[],
 *  metadata?: {
 *    title?: string,
 *    description?: string,
 *  }
 * }} data
 * @returns {string}
 *
 */
export function compileTemplateToHTML(template, data = {}) {
  try {
    const cleanTemplate = template
      .replace(/[\r\n\t]+/g, " ")
      .replace(/ +/g, " ")
      .trim();

    // Parse HTML using xmlMode to preserve case
    const dom = parseDocument(cleanTemplate, { xmlMode: true });

    const children = DomUtils.getChildren(dom);
    const processed = children
      .map((n) => processNode(n, data))
      .flat()
      .filter(Boolean);

    return render(processed, { encodeEntities: false });
  } catch (error) {
    console.error("Error compiling template:", error);
    throw error;
  }
}
