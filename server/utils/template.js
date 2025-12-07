import fs from "fs";
import path from "path";

function unwrapTemplate(html) {
  const match = html.match(/<template>([\s\S]*?)<\/template>/);
  return match ? match[1] : html;
}

function getProp(obj, path) {
  return path.split(".").reduce((acc, part) => acc?.[part], obj);
}

function renderTemplate(templateFile, data) {
  const file = path.resolve(templateFile);
  let html = fs.readFileSync(file, "utf-8");

  // replace {{key}} with data[key]
  html = unwrapTemplate(html).replace(/{{([^}]+)}}/g, (_, key) => {
    const value = getProp(data, key.trim());
    return value ?? "";
  });

  return html;
}

export { renderTemplate };
