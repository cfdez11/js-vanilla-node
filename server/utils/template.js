import { parseDocument, DomUtils } from "htmlparser2";
import { render } from "dom-serializer";

function evaluate(expr, scope) {
  try {
    return Function(
      ...Object.keys(scope),
      `return (${expr})`
    )(...Object.values(scope));
  } catch (e) {
    return "";
  }
}

function isEmptyTextNode(node) {
  return node.type === "text" && /^\s*$/.test(node.data);
}

function processNode(node, scope, previousRendered = false) {
  if (node.type === "text") {
    node.data = node.data.replace(/\{\{(.+?)\}\}/g, (_, expr) =>
      evaluate(expr.trim(), scope)
    );
    return node;
  }

  if (node.type === "tag") {
    const attrs = node.attribs || {};

    // ---- v-if ----
    if ("v-if" in attrs) {
      const show = evaluate(attrs["v-if"], scope);
      delete attrs["v-if"];
      if (!show) return null;
    }

    // ---- v-else / v-else-if ----
    if ("v-else-if" in attrs) {
      const show = evaluate(attrs["v-else-if"], scope);
      delete attrs["v-else-if"];
      if (previousRendered || !show) return null;
    }

    if ("v-else" in attrs) {
      delete attrs["v-else"];
      if (previousRendered) {
        return null; // no renderizamos porque el anterior sí se mostró
      }
    }

    // ---- v-show ----
    if ("v-show" in attrs) {
      const show = evaluate(attrs["v-show"], scope);
      delete attrs["v-show"];
      if (!show) {
        attrs.style = (attrs.style || "") + "display:none;";
      }
    }

    // ---- v-for ----
    if ("v-for" in attrs) {
      const exp = attrs["v-for"];
      delete attrs["v-for"];

      // format: item in items
      const match = exp.match(/(.+?)\s+in\s+(.+)/);
      if (!match) throw new Error("Invalid v-for format: " + exp);

      const itemName = match[1].trim();
      const listExpr = match[2].trim();
      const list = evaluate(listExpr, scope);

      if (!Array.isArray(list)) return null;

      const clones = [];

      for (const item of list) {
        const cloned = structuredClone(node);
        const newScope = { ...scope, [itemName]: item };
        clones.push(processNode(cloned, newScope));
      }

      return clones;
    }

    // ---- :prop and v-bind:prop ----
    for (const [name, value] of Object.entries({ ...attrs })) {
      if (name.startsWith(":")) {
        const realName = name.slice(1);
        attrs[realName] = evaluate(value, scope);
        delete attrs[name];
      }

      if (name.startsWith("v-bind:")) {
        const realName = name.slice(7);
        attrs[realName] = evaluate(value, scope);
        delete attrs[name];
      }
    }

    // ---- @event and v-on:event ----
    for (const [name] of Object.entries({ ...attrs })) {
      if (name.startsWith("@") || name.startsWith("v-on:")) {
        delete attrs[name];
      }
    }

    // process children
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
 */
export function compileTemplateToHTML(template, data = {}) {
  const cleanTemplate = template
    .replace(/[\r\n\t]+/g, " ")
    .replace(/ +/g, " ")
    .trim();
  const dom = parseDocument(cleanTemplate);

  const children = DomUtils.getChildren(dom);
  const processed = children
    .map((n) => processNode(n, data))
    .flat()
    .filter(Boolean);

  return render(processed, { encodeEntities: false });
}
