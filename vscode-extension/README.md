# VexJS — VSCode Extension

Syntax highlighting for **VexJS**, a vanilla JavaScript meta-framework with file-based routing, SSR/CSR/SSG/ISR rendering strategies, and a Vue-like reactive system.

## Features

- Syntax highlighting for `.vex` files and framework HTML files (`pages/**/*.html`, `components/**/*.html`)
- Three distinct sections highlighted independently:
  - `<script server>` — Node.js server-side code (runs per request)
  - `<script client>` — Browser-side reactive code
  - `<template>` — HTML with directives
- Directive highlighting: `x-if`, `x-for`, `x-show`, `:prop`, `@event`
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
4. Select the `.vsix` file from the `vscode-extension/` folder

Or via the CLI:

```bash
code --install-extension vscode-extension/vexjs-x.x.x.vsix
```

### From source (development)

```bash
cd vscode-extension
npm install -g @vscode/vsce   # install packaging tool if not present
vsce package                  # generates vexjs-x.x.x.vsix
code --install-extension vexjs-*.vsix
```

## File Icon

VS Code icon themes are mutually exclusive — activating one replaces another entirely. To keep your current icon theme and add the `.vex` icon, configure the association inside your active theme:

**Material Icon Theme** (`settings.json`):
```json
"material-icon-theme.files.associations": {
  "*.vex": "html"
}
```

**VSCode Icons** (`settings.json`):
```json
"vsicons.associations.files": [
  { "icon": "html", "extensions": ["vex"], "format": "svg" }
]
```

**Any other theme** — most themes use `html` as a reasonable fallback for `.vex` files. Check your theme's documentation for the custom associations setting.

The icon SVG (`icons/vex-file.svg`) is included in this extension if you ever want to reference it manually.

## Requirements

- VS Code `^1.75.0`

## Known Limitations

- Autocompletion for directives (`x-if`, `x-for`, etc.) is not yet implemented
- Jump-to-definition for component imports is not yet supported
- Lint of `{{ }}` expressions is not yet supported

## License

MIT
