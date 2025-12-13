import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..", "..");

/**
 * Recursively reads a directory and returns a list of all file paths.
 * @param {string} dir - The directory to read.
 * @returns {Promise<{
 *  fullpath: string;
 *  name: string;
 * }[]>} - A promise that resolves to an array of file paths.
 */
export async function readDirectoryRecursive(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullpath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...await readDirectoryRecursive(fullpath));
    } else {
      files.push({
        fullpath,
        name: entry.name,
      });
    }
  }

  return files;
}

export const getComponentNameFromPath = (fullFilepath, fileName) => {
  const filePath = fullFilepath.replace(rootDir + path.sep, "");
  const isPage = filePath.startsWith(path.join("pages", path.sep));
  if (isPage) {
    // check if is in the root of pages directory
    const segments = filePath.split(path.sep);
    if (segments.length === 2) {
      return segments[0].replace(".html", ""); // return the folder name
    } else {
      return segments[segments.length - 2].replace(".html", ""); // return the parent folder name
    }
  }

  return fileName.replace(".html", "");
}
