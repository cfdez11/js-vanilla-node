---
name: vex
description: Use this skill when working with the @cfdez11/vex framework — creating pages, components, layouts, or configuring rendering strategies (SSR, SSG, ISR, CSR). Also use it when asked about reactive state, template syntax, Suspense, or the vex/ import prefix.
---

# @cfdez11/vex Framework

A custom meta-framework built on Express.js with file-based routing, multiple rendering strategies, and a Vue-like reactive system — in vanilla JavaScript.

## Project structure

```
pages/          # File-based routes
components/     # Reusable components
utils/          # User utilities (e.g. delay.js)
public/         # Static assets (styles.css, images)
src/input.css   # Tailwind entry point
root.html       # HTML shell template
```

## File-based routing

| File | Route |
|------|-------|
| `pages/page.vex` | `/` |
| `pages/about/page.vex` | `/about` |
| `pages/users/[id]/page.vex` | `/users/:id` |
| `pages/layout.vex` | wraps all pages |
| `pages/not-found/page.vex` | 404 |
| `pages/error/page.vex` | 500 |

## Component file structure (.vex)

Every `.vex` file has three optional sections:

```html
<script server>
  // Runs on the server per request. Can use Node.js APIs, async/await, imports.
  const metadata = { title: "Page title" };

  async function getData({ req, props }) {
    // req.params for dynamic route segments
    // props for values passed from parent
    return { user: await fetchUser(req.params.id) };
  }
</script>

<script client>
  // Bundled and sent to the browser.
  import { reactive, computed, effect, watch } from "vex/reactive";
  import { useRouteParams } from "vex/navigation";

  const count = reactive(0);
</script>

<template>
  <!-- VexJS template syntax -->
  <h1>{{title}}</h1>
  <button @click="count.value++">{{count.value}}</button>
</template>
```

## Server script conventions

- `getData({ req, props })` — async, return value is merged into template scope
- `metadata` — plain object with page config (title, description, static, revalidate)
- `getMetadata({ req, props })` — async version of metadata
- `getStaticPaths()` — returns `[{ params: {...} }]` for pre-rendering dynamic routes
- `@event` handlers are stripped server-side — only work in `<script client>`

## Component props (xprops)

```javascript
// Inside <script server> or <script client>
const props = xprops({
  userId: { default: null },
  start: { default: 10 },
});
```

Parent passes props as attributes: `<UserCard :userId="user.id" />`

## Rendering strategies

Configured via `metadata` in `<script server>`:

| Strategy | Config | Behavior |
|----------|--------|----------|
| SSR | default | Rendered fresh on each request |
| SSG | `metadata.static = true` | Rendered once, cached forever |
| ISR | `metadata.revalidate = 10` | Cached, revalidated every N seconds |
| CSR | only `<script client>` | Client fetches its own data |

`revalidate` values: number (seconds), `true` (60s), `0` (stale-while-revalidate), `false`/`"never"`.

## Template syntax

| Syntax | Description |
|--------|-------------|
| `{{expr}}` | Expression interpolation |
| `x-if="expr"` | Conditional rendering |
| `x-for="item in items"` | List rendering |
| `x-show="expr"` | Toggle visibility |
| `:prop="expr"` | Dynamic prop binding |
| `@click="handler"` | Event binding (client only) |

Template expressions are evaluated against `getData()` return value merged with `metadata`.
Avoid complex logic in templates — use `getData` instead. Ternaries and filters are not supported.

## Client-side reactivity

```javascript
import { reactive, computed, effect, watch } from "vex/reactive";

// Primitives → use .value
const count = reactive(0);
count.value++;

// Objects → direct access
const state = reactive({ x: 1 });
state.x++;

// Computed
const double = computed(() => count.value * 2);
double.value; // read only

// Effect (runs immediately, re-runs on dependency change)
effect(() => console.log(count.value));

// Watch (does NOT run on creation)
watch(() => count.value, (newVal) => console.log(newVal));
```

## Framework imports (vex/ prefix)

| Import | Resolves to |
|--------|-------------|
| `vex/reactive` | Reactivity engine (client scripts) |
| `vex/navigation` | SPA router utilities (client scripts) |

## Suspense + streaming

```html
<Suspense :fallback="<UserCardSkeleton />">
  <UserCardDelayed :userId="1" />
</Suspense>
```

Server streams the skeleton immediately, then replaces it when the slow component resolves.

## Dev commands (run from the project directory)

```bash
pnpm dev          # server + Tailwind watcher
pnpm dev:server   # Node.js server only (--watch)
pnpm dev:css      # Tailwind watcher only
pnpm build        # generate routes + bundle client components
pnpm start        # production server on port 3001
```

Run `pnpm build` after adding new pages or components.

## Common patterns

### New SSR page with data

```html
<script server>
  const metadata = { title: "Users" };
  async function getData({ req }) {
    return { users: await fetchUsers() };
  }
</script>
<template>
  <ul>
    <li x-for="user in users">{{user.name}}</li>
  </ul>
</template>
```

### New CSR component

```html
<script client>
  import { reactive } from "vex/reactive";
  const props = xprops({ label: { default: "Click me" } });
  const count = reactive(0);
</script>
<template>
  <button @click="count.value++">{{props.label}}: {{count.value}}</button>
</template>
```

### Static page with external data (SSG)

```html
<script server>
  const metadata = { title: "Docs", static: true };
  async function getData() {
    return { content: await fetchDocs() };
  }
</script>
<template>
  <div>{{content}}</div>
</template>
```
