import fs from "fs";
import path from "path";

/**
 * Unwraps content inside <template> tags
 * @param {string} html
 * @returns {string}
 */
function unwrapTemplate(html) {
  const match = html.match(/<template>([\s\S]*?)<\/template>/);
  return match ? match[1] : html;
}

/** Retrieves nested property from object using dot notation path
 *  @param {{
 *  children: string,
 *  clientScripts: string[],
 *  metadata: {
 *    title: string,
 *    description: string,
 *  }
 * }} data
 * @param {string} path
 * @returns {string | string[] | undefined}
 */
function getProp(obj, path) {
  return path.split(".").reduce((acc, part) => acc?.[part], obj);
}

/**
 * Renders HTML template file with provided data
 * @param {string} templateFile
 * @param {{
 *  children: string,
 *  clientScripts: string[],
 *  metadata: {
 *    title: string,
 *    description: string,
 *  }
 * }} data
 * @returns {string}
 */
export function renderTemplate(templateFile, data) {
  const file = path.resolve(templateFile);
  let html = fs.readFileSync(file, "utf-8");

  // replace {{key}} with data[key]
  html = unwrapTemplate(html).replace(/{{([^}]+)}}/g, (_, key) => {
    const value = getProp(data, key.trim());
    return value ?? "";
  });

  return html;
}
