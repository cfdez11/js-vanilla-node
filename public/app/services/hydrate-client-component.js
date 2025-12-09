/**
 * Client-side hydration script for client components
 * Fetches, parses and initializes client components
 */
(async function () {
  const script = document.currentScript;
  const componentPath = script.dataset.component;
  const targetId = script.dataset.target;
  const componentProps = script.dataset.props
    ? JSON.parse(script.dataset.props)
    : {};

  try {
    // Fetch the component HTML
    const response = await fetch(componentPath);
    const html = await response.text();

    // Parse the component
    const { clientCode, template } = parseClientComponent(html, componentProps);

    // Create a module script with the component code
    // TODO: Cuando hace el render deberiamos pasarle antes el template a función que convierte html con vue sintaxis a html puro
    // TODO: definir un effect para que cuando cambien los props se re-renderice el componente igual que usa el class component "Component"
    // TODO: mirar de si este textContent que contiene el js se puede optmizar o tener un componente base (aunque en teoria solo hay que añadir el effect y las cosas que tiene class component "Component")
    // TODO: revisar si se puede ocultar o minimizar el script que se inyecta en el header de la pagina
    const moduleScript = document.createElement("script");
    moduleScript.type = "module";
    moduleScript.textContent = `
      ${clientCode}
      
      // Get target element
      const target = document.getElementById('${targetId}');
      
      // Function to render the component
      function renderComponent() {
        const tpl = document.createElement("template");
        tpl.innerHTML = \`${template}\`.trim(); // usa backticks
        return tpl.content.firstElementChild;
      }
      
      // Render into target
      if (target) {
        target.appendChild(renderComponent());
      }
    `;

    document.head.appendChild(moduleScript);
  } catch (error) {
    console.error("Error hydrating client component:", error);
  }

  // Clean up the script tag
  script.remove();
})();

function extractVPropsObject(code) {
  const match = code.match(/vprops\s*\(\s*(\{[\s\S]*?\})\s*\)/);

  return match ? match[1] : null;
}

/**
 * Avoid execute expressions with side effects like function calls, if, loops, etc.
 * @param {string} objectLiteral
 * @returns {object}
 */
function safeObjectEval(objectLiteral) {
  return Function(`"use strict"; return (${objectLiteral})`)();
}

/**
 * Applies default props from vprops definition
 * @param {object} vpropsDef
 * @param {object} componentProps
 * @returns {object}
 */
function applyDefaultProps(vpropsDefined, componentProps) {
  const finalProps = {};

  for (const key in vpropsDefined) {
    const def = vpropsDefined[key];

    if (key in componentProps) {
      finalProps[key] = componentProps[key];
    } else if ("default" in def) {
      finalProps[key] = def.default;
    } else {
      finalProps[key] = undefined;
    }
  }

  return finalProps;
}

/**
 * From client code and component props, generate an object with the props based on vprops definition
 * @param {string} clientCode
 * @param {object} componentProps
 * @returns {object}
 */
function computeProps(clientCode, componentProps) {
  const vpropsLiteral = extractVPropsObject(clientCode);

  if (!vpropsLiteral) return componentProps;

  const vpropsDefined = safeObjectEval(vpropsLiteral);

  const finalProps = applyDefaultProps(vpropsDefined, componentProps);

  return finalProps;
}

/**
 * Adds computed props to client code if are defined
 * @param {string} clientCode
 * @param {object} componentProps
 */
const addComputedProps = (clientCode, componentProps) => {
  const vpropsRegex = /const\s+props\s*=\s*vprops\s*\([\s\S]*?\)\s*;?/;
  const hasVprops = vpropsRegex.test(clientCode);

  if (hasVprops) {
    const computedProps = computeProps(clientCode, componentProps);

    clientCode = clientCode.replace(
      vpropsRegex,
      `const props = ${JSON.stringify(computedProps)};`
    );
  }

  return clientCode;
};

/**
 * Parse client component HTML to extract script and template
 * @param {string} html - Component HTML content
 * @param {object} props - Component props
 * @returns {{clientCode: string, template: string}}
 */
function parseClientComponent(html, props) {
  const clientMatch = html.match(/<script client>([\s\S]*?)<\/script>/);
  const templateMatch = html.match(/<template>([\s\S]*?)<\/template>/);

  let clientCode = clientMatch ? clientMatch[1].trim() : "";
  const template = templateMatch ? templateMatch[1].trim() : "";

  clientCode = addComputedProps(clientCode, props);

  return { clientCode, template };
}
