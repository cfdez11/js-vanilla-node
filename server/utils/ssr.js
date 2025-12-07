import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serverElementRegex = /<([a-z0-9-]+)\s+([^>]*)server([^>]*)><\/\1>/g;

function parseAttributes(raw) {
  const attrs = {};
  const regex = /([a-zA-Z0-9_-]+)="([^"]*)"/g;
  let match;
  while ((match = regex.exec(raw))) {
    attrs[match[1]] = match[2];
  }
  return attrs;
}

export async function renderServerComponents(html) {
  let match;
  while ((match = serverElementRegex.exec(html)) !== null) {
    const tag = match[1];
    const rawAttrs = match[2] + match[3];
    const attrs = parseAttributes(rawAttrs);

    // remove prefix 's-' if exists
    const componentName = tag.substring(2);

    const modulePath = path.resolve(
      __dirname,
      "../components",
      `${componentName}.js`
    );

    const componentModule = await import(pathToFileURL(modulePath).href);

    const rendered = await componentModule.default(attrs);

    html = html.replace(match[0], rendered);
  }
  return html;
}
