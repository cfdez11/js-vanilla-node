const vscode = require("vscode");
const path = require("path");
const fs = require("fs");

const IMPORT_REGEX = /from\s+['"]([^'"]+)['"]/g;

function findProjectRoot(startDir) {
  let dir = startDir;
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, "package.json"))) return dir;
    dir = path.dirname(dir);
  }
  return startDir;
}

function findVexjsDir(projectRoot) {
  const candidates = [
    path.join(projectRoot, "node_modules", "vexjs"),
    path.join(projectRoot, "..", "vexjs"),
  ];
  return candidates.find(fs.existsSync) || null;
}

function resolveImportPath(importPath, currentFileDir, projectRoot) {
  if (importPath.startsWith("./") || importPath.startsWith("../")) {
    return path.resolve(currentFileDir, importPath);
  }
  if (importPath.startsWith("vex/")) {
    const vexjsDir = findVexjsDir(projectRoot);
    if (vexjsDir) {
      const relative = importPath.replace("vex/", "");
      return path.resolve(vexjsDir, "client", "services", relative);
    }
  }
  return path.resolve(projectRoot, importPath);
}

function tryExtensions(filePath) {
  const candidates = [
    filePath,
    filePath + ".js",
    filePath + ".vex",
    filePath + ".ts",
    path.join(filePath, "index.js"),
    path.join(filePath, "index.vex"),
    path.join(filePath, "index.ts"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

/** @param {vscode.ExtensionContext} context */
function activate(context) {
  const provider = vscode.languages.registerDefinitionProvider("vexjs", {
    provideDefinition(document, position) {
      const line = document.lineAt(position).text;
      let match;
      IMPORT_REGEX.lastIndex = 0;

      while ((match = IMPORT_REGEX.exec(line)) !== null) {
        const importPath = match[1];
        const start = line.indexOf(importPath, match.index);
        const range = new vscode.Range(
          position.line, start,
          position.line, start + importPath.length
        );

        if (!range.contains(position)) continue;

        const currentFileDir = path.dirname(document.fileName);
        const projectRoot = findProjectRoot(currentFileDir);
        const resolved = resolveImportPath(importPath, currentFileDir, projectRoot);
        const finalPath = tryExtensions(resolved);

        if (finalPath) {
          return new vscode.Location(
            vscode.Uri.file(finalPath),
            new vscode.Position(0, 0)
          );
        }
      }
    },
  });

  context.subscriptions.push(provider);
}

function deactivate() {}

module.exports = { activate, deactivate };
