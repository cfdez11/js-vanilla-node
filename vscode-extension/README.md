# VexJS — VSCode Extension

Syntax highlighting for **VexJS**, a vanilla JavaScript meta-framework with file-based routing, SSR/CSR/SSG/ISR rendering strategies, and a Vue-like reactive system.

## Features

- Syntax highlighting for `.vex` files and framework HTML files (`pages/**/*.html`, `components/**/*.html`)
- Three distinct sections highlighted independently:
  - `<script server>` — Node.js server-side code (runs per request)
  - `<script client>` — Browser-side reactive code
  - `<template>` — Vue-like HTML with directives
- Directive highlighting: `v-if`, `v-for`, `v-show`, `:prop`, `@event`
- Expression highlighting inside `{{ }}` interpolations
- Embedded JavaScript language support in script blocks (autocompletion, IntelliSense)

## File Format

VexJS components use the `.vex` extension (or `.html` under `pages/` and `components/`):

```html
<script server>
  async function getData({ req, props }) {
    return { title: "Hello World" };
  }
</script>

<script client>
  import { reactive } from ".app/reactive.js";
  const count = reactive(0);
</script>

<template>
  <h1>{{ title }}</h1>
  <button @click="count.value++">{{ count.value }}</button>
</template>
```

## Installation

### From `.vsix` file (local install)

1. Open VS Code
2. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
3. Run **Extensions: Install from VSIX...**
4. Select the `vexjs-0.1.0.vsix` file from the `vscode-extension/` folder

Or via the CLI:

```bash
code --install-extension vscode-extension/vexjs-0.1.0.vsix
```

### From source (development)

```bash
cd vscode-extension
npm install -g @vscode/vsce   # install packaging tool if not present
vsce package                  # generates vexjs-x.x.x.vsix
code --install-extension vexjs-*.vsix
```

## Requirements

- VS Code `^1.75.0`

## Extension Settings

No configuration required. The extension activates automatically for `.vex` files and HTML files inside `pages/` and `components/` directories.

## Known Limitations

- Autocompletion for directives (`v-if`, `v-for`, etc.) is not yet implemented
- Jump-to-definition for component imports is not yet supported
- Lint of `{{ }}` expressions is not yet supported

## License

MIT
