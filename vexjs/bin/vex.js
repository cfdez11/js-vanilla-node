#!/usr/bin/env node

import { spawn } from "child_process";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverDir = path.resolve(__dirname, "..", "server");

const [command] = process.argv.slice(2);

const commands = {
  dev: () =>
    spawn(
      "node",
      ["--watch", path.join(serverDir, "index.js")],
      { stdio: "inherit" }
    ),

  build: () =>
    spawn(
      "node",
      [path.join(serverDir, "prebuild.js")],
      { stdio: "inherit" }
    ),

  start: () =>
    spawn(
      "node",
      [path.join(serverDir, "index.js")],
      { stdio: "inherit", env: { ...process.env, NODE_ENV: "production" } }
    ),
};

if (!commands[command]) {
  console.error(`Unknown command: "${command}"\nAvailable: dev, build, start`);
  process.exit(1);
}

const child = commands[command]();
child.on("exit", code => process.exit(code ?? 0));
