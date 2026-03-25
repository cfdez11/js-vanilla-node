# Vanilla JS Framework

[![pnpm](https://img.shields.io/badge/pnpm-F69220?logo=pnpm&logoColor=fff)](#)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=000)](#)
[![Node.js](https://img.shields.io/badge/Node.js-6DA55F?logo=node.js&logoColor=white)](#)

A minimalist vanilla JavaScript framework with support for Server-Side Rendering (SSR), Client-Side Rendering (CSR), reactive components, and streaming with suspense.

## � Table of Contents

- [Vanilla JS Framework](#vanilla-js-framework)
  - [� Table of Contents](#-table-of-contents)
  - [✨ Key Features](#-key-features)
  - [�📁 Project Structure](#-project-structure)
  - [🚀 Quick Start](#-quick-start)
  - [📄 Creating a Page](#-creating-a-page)
  - [🧩 Components](#-components)
    - [Component Structure](#component-structure)
    - [Server Components](#server-components)
    - [Using Components](#using-components)
  - [🎭 Rendering Strategies](#-rendering-strategies)
    - [SSR - Server-Side Rendering](#ssr---server-side-rendering)
    - [CSR - Client-Side Rendering](#csr---client-side-rendering)
    - [SSG - Static Site Generation](#ssg---static-site-generation)
    - [ISR - Incremental Static Regeneration](#isr---incremental-static-regeneration)
  - [📐 Layouts](#-layouts)
    - [Root Layout](#root-layout)
    - [Custom Nested Layouts](#custom-nested-layouts)
  - [⏳ Suspense (Streaming)](#-suspense-streaming)
  - [🔄 Reactive System](#-reactive-system)
    - [Available Functions](#available-functions)
      - [`reactive(value)`](#reactivevalue)
      - [`effect(fn)`](#effectfn)
      - [`computed(getter)`](#computedgetter)
      - [`watch(source, callback, options)`](#watchsource-callback-options)
    - [In Components](#in-components)
    - [Reactivity Comparison](#reactivity-comparison)
  - [📝 Template Syntax](#-template-syntax)
    - [Interpolation](#interpolation)
    - [Conditionals](#conditionals)
    - [Lists](#lists)
    - [Event Handlers](#event-handlers)
    - [Attributes](#attributes)
  - [🛣️ Routing](#️-routing)
    - [Auto-Generated Routes](#auto-generated-routes)
    - [Dynamic Routes](#dynamic-routes)
    - [Client-Side Navigation](#client-side-navigation)
    - [Accessing Route Parameters](#accessing-route-parameters)
  - [⚡ Prefetching](#-prefetching)
    - [Automatic Prefetching](#automatic-prefetching)
  - [🎨 Styling](#-styling)
  - [🔧 Framework API](#-framework-api)
    - [Component Props](#component-props)
    - [Reactive State](#reactive-state)
    - [Navigation Utilities](#navigation-utilities)
  - [📦 Available Scripts](#-available-scripts)
  - [🏗️ Rendering Flow](#️-rendering-flow)
    - [SSR (Server-Side Rendering)](#ssr-server-side-rendering)
    - [CSR (Client-Side Rendering)](#csr-client-side-rendering)
    - [ISR (Incremental Static Regeneration)](#isr-incremental-static-regeneration)
    - [Server Startup](#server-startup)
    - [Build Process](#build-process)
    - [Client Hydration](#client-hydration)
  - [🗺️ Roadmap](#️-roadmap)

## ✨ Key Features

- 🚀 **Multiple Rendering Strategies**: SSR, CSR, SSG, and ISR support
- ⚡ **Auto-Generated Routes**: File-based routing with dynamic routes `[param]`
- 🔄 **Reactive System**: Vue-like reactivity with `reactive()` and `computed()`
- 🧩 **Component-Based**: Reusable `.html` components (server & client)
- 🎭 **Streaming & Suspense**: Progressive loading with fallback UI
- 📐 **Nested Layouts**: Custom layouts per route
- 🔗 **Smart Prefetching**: Automatic page prefetching on link hover
- 💾 **Built-in Caching**: Server and client-side caching
- 🎨 **Tailwind CSS**: Integrated styling solution
- 📝 **Template Syntax**: Familiar directives (`v-if`, `v-for`, `@click`, etc.)
- 🌐 **SPA Navigation**: Client-side routing without page reloads
- 🔌 **Zero Config**: No manual route registration needed
- 📦 **Pure JavaScript**: No TypeScript to focus on core functionality without build complexity

## �📁 Project Structure

```
├── pages/                       # Application pages
│   ├── layout.html             # Main layout (header, footer, etc.)
│   ├── page.html               # Home page
│   ├── error/page.html         # Error page
│   ├── not-found/page.html     # 404 page
│   ├── page-csr/               # CSR example
│   │   ├── page.html           # CSR main page
│   │   └── [city]/page.html    # Dynamic CSR route
│   ├── page-ssr/               # SSR example
│   │   ├── page.html           # SSR main page
│   │   └── [city]/page.html    # Dynamic SSR route
│   ├── static/                 # Static page example
│   │   ├── layout.html         # Static layout
│   │   └── page.html           # Static page
│   └── static-with-data/       # Static with data example
│       └── page.html           # Static page with data fetching
├── components/                  # Component definitions (.html files)
│   ├── counter.html            # Counter component
│   ├── user-card.html          # User card component
│   ├── user-card-delayed.html  # Delayed user card (for suspense demo)
│   ├── user-card-skeleton.html # Skeleton placeholder
│   ├── weather.html            # Weather component
│   └── weather/                # Weather sub-components
│       ├── weather-links.html
│       ├── weather-params.html
│       └── weather-state.html
└── .app/                        # Framework files (do not edit)
    ├── client/                 # Client-side framework
    │   ├── services/           # Client framework core
    │   │   ├── reactive.js     # Reactivity system
    │   │   ├── html.js         # Template literal helpers
    │   │   ├── hydrate.js      # Component hydration
    │   │   ├── cache.js        # Client-side caching
    │   │   ├── navigation/     # Navigation utilities
    │   │   │   ├── router.js   # Client router
    │   │   │   ├── navigate.js # Navigation API
    │   │   │   ├── prefetch.js # Page prefetching
    │   │   │   ├── metadata.js # Dynamic metadata
    │   │   │   └── ...
    │   │   └── _routes.js      # Auto-generated routes
    │   ├── _components/        # Auto-generated component scripts
    │   ├── styles.css          # Compiled Tailwind styles
    │   └── favicon.ico         # Favicon
    └── server/                 # Server-side framework
        ├── index.js            # Entry point
        ├── root.html           # Root HTML template
        ├── _cache/             # Server-side cache
        └── utils/              # Server utilities
            ├── router.js       # Router and SSR rendering
            ├── component-processor.js  # Component processing
            ├── template.js     # Template rendering
            ├── streaming.js    # Suspense and streaming
            ├── cache.js        # Server-side caching
            ├── files.js        # File system utilities
            └── _routes.js      # Auto-generated routes
```

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Start production server
pnpm start
```

The server will be available at `http://localhost:3000`

## 📄 Creating a Page

Pages are created in `pages/` with the following structure:

```html
<!-- pages/example/page.html -->
<script server>
  // Server-side imports (components)
  import UserCard from "components/user-card.html";

  // Server-side data fetching
  async function getData() {
    return { message: "Hello from the server" };
  }

  // Page metadata
  const metadata = {
    title: "My Page",
    description: "Page description",
  };
</script>

<script client>
  // Client-side component imports
  import Counter from "components/counter.html";
</script>

<template>
  <h1>{{message}}</h1>
  <Counter start="0" />
  <UserCard userId="123" />
</template>
```

**Routes are auto-generated** from the `pages/` folder structure. No need to manually register routes!

## 🧩 Components

Components are defined in `.html` files within the `components/` folder. They can be either client-side or server-side components.

### Component Structure

```html
<!-- components/counter.html -->
<script client>
  import { reactive, computed } from ".app/reactive.js";

  // Component props
  const props = vprops({
    start: { default: 10 },
  });

  // Reactive state
  const counter = reactive(props.start);

  // Methods
  function increment() {
    counter.value++;
  }

  function decrement() {
    counter.value--;
  }

  // Computed values
  const stars = computed(() => Array.from({ length: counter.value }, () => "⭐"));
</script>

<template>
  <div class="flex items-center gap-4">
    <button @click="decrement" :disabled="counter <= 0">
      Sub
    </button>
    <span>{{counter}}</span>
    <button @click="increment">
      Add
    </button>
    <div>{{stars.join('')}}</div>
  </div>
</template>
```

### Server Components

Server components are rendered on the backend and support async data fetching:

```html
<!-- components/user-card.html -->
<script server>
  const props = vprops({
    userId: { required: true },
  });

  async function getData() {
    const user = await fetch(`https://api.example.com/users/${props.userId}`)
      .then(res => res.json());
    return { user };
  }
</script>

<template>
  <div class="user-card">
    <h3>{{user.name}}</h3>
    <p>{{user.email}}</p>
  </div>
</template>
```

### Using Components

Import and use components in your pages:

```html
<!-- In pages/page.html -->
<script client>
  import Counter from "components/counter.html";
</script>

<script server>
  import UserCard from "components/user-card.html";
</script>

<template>
  <Counter start="5" />
  <UserCard userId="123" />
</template>
```

## 🎭 Rendering Strategies

The framework supports multiple rendering strategies to optimize performance and user experience based on your needs.

### SSR - Server-Side Rendering

**When to use**: Dynamic content that changes frequently, SEO-critical pages, personalized content.

Pages are rendered on the server for each request. HTML is generated with fresh data and sent to the client.

```html
<!-- pages/page-ssr/page.html -->
<script server>
  async function getData() {
    // Fresh data on every request
    const data = await fetch('https://api.example.com/data').then(r => r.json());
    return { data };
  }

  const metadata = {
    title: "SSR Page",
    description: "Server-rendered on every request"
  };
</script>

<template>
  <h1>{{data.title}}</h1>
  <p>Generated at: {{new Date().toISOString()}}</p>
</template>
```

**Characteristics:**
- ✅ Fresh data on every request
- ✅ Best for SEO (fully rendered HTML)
- ✅ Fast initial page load
- ⚠️ Server load on every request

### CSR - Client-Side Rendering

**When to use**: Highly interactive dashboards, authenticated areas, apps with frequent updates.

Minimal HTML is sent from the server. All rendering happens in the browser using JavaScript.

```html
<!-- pages/page-csr/page.html -->
<script client>
  import { reactive } from ".app/reactive.js";
  
  const data = reactive(null);
  
  // Fetch data on client
  async function loadData() {
    const response = await fetch('https://api.example.com/data');
    data.value = await response.json();
  }
  
  loadData();
</script>

<template>
  <div v-if="data">
    <h1>{{data.title}}</h1>
  </div>
  <div v-else>
    Loading...
  </div>
</template>
```

**Characteristics:**
- ✅ Highly interactive
- ✅ Reduced server load
- ✅ Instant navigation after first load
- ⚠️ Slower initial render
- ⚠️ Less SEO-friendly

### SSG - Static Site Generation

**When to use**: Content that rarely changes (docs, blogs, marketing pages).

Pages are pre-rendered at build time and served as static HTML. No server processing on requests.

```html
<!-- pages/static-with-data/page.html -->
<script server>
  async function getData() {
    // Fetched once at build time
    const data = await fetch('https://api.example.com/content').then(r => r.json());
    return { data };
  }

  const metadata = {
    title: "Static Page",
    description: "Pre-rendered at build time",
    revalidate: 'never' // Never regenerate
  };
</script>

<template>
  <h1>{{data.title}}</h1>
  <p>Built at: {{new Date().toISOString()}}</p>
</template>
```

**Characteristics:**
- ✅ Fastest possible delivery (static files)
- ✅ Lowest server cost
- ✅ Perfect for SEO
- ✅ Can be served from CDN
- ⚠️ Content only updates on rebuild

### ISR - Incremental Static Regeneration

**When to use**: Content that changes occasionally (product pages, articles with comments).

Pages are statically generated but automatically regenerate after a specified time period.

```html
<!-- pages/page-ssr/[city]/page.html -->
<script server>
  import { useRouteParams } from ".app/navigation/use-route-params.js";
  
  async function getData() {
    const { city } = useRouteParams();
    const weather = await fetch(`https://api.weather.com/${city}`).then(r => r.json());
    return { city, weather };
  }

  const metadata = {
    title: "Weather",
    description: "Weather with ISR",
    revalidate: 10 // Regenerate every 10 seconds
  };
</script>

<template>
  <h1>Weather in {{city}}</h1>
  <p>Temperature: {{weather.temp}}°C</p>
  <p class="text-sm text-gray-500">Updates every 10 seconds</p>
</template>
```

**Characteristics:**
- ✅ Static performance with fresh content
- ✅ Automatic background regeneration
- ✅ Best of both worlds (speed + freshness)
- ✅ Reduces API calls
- ⚠️ Slightly stale data possible (within revalidation window)

**Revalidation options:**
```js
const metadata = {
  revalidate: 'never',  // Pure static (SSG)
  revalidate: 10,       // Regenerate every 10 seconds (ISR)
  // No revalidate      // Server-side rendering on every request (SSR)
};
```

## 📐 Layouts

The framework supports nested layouts for consistent page structure.

### Root Layout

The main layout is defined in `pages/layout.html` and wraps all pages:

```html
<!-- pages/layout.html -->
<script client>
  const props = vprops({
    children: { default: null },
  });
</script>

<template>
  <div>
    <header class="bg-white shadow">
      <nav>
        <a href="/">Home</a>
        <a href="/page-ssr">SSR</a>
        <a href="/page-csr">CSR</a>
      </nav>
    </header>
    
    <main>
      {{children}} <!-- Page content injected here -->
    </main>
    
    <footer class="bg-gray-800 text-white">
      <p>&copy; 2026 My App</p>
    </footer>
  </div>
</template>
```

### Custom Nested Layouts

You can create custom layouts for specific routes:

```html
<!-- pages/static/layout.html -->
<script client>
  const props = vprops({
    children: { default: null },
  });
</script>

<template>
  <div class="static-layout">
    <aside class="sidebar">
      <!-- Sidebar navigation -->
    </aside>
    <div class="content">
      {{children}} <!-- Page content -->
    </div>
  </div>
</template>
```

**Layout Hierarchy:**
```
pages/layout.html (root layout)
  └─> pages/static/layout.html (custom layout for /static/*)
       └─> pages/static/page.html (page content)
```

## ⏳ Suspense (Streaming)

Allows showing a fallback while content loads asynchronously:

```html
<script server>
  import UserCardDelayed from "components/user-card-delayed.html";
  import UserCardSkeleton from "components/user-card-skeleton.html";
</script>

<template>
  <Suspense :fallback="<UserCardSkeleton />">
    <UserCardDelayed userId="123" />
  </Suspense>
</template>
```

**Benefits:**

- The rest of the page is shown immediately
- Slow components load via streaming
- Improves perceived performance
- Better user experience with progressive loading

## 🔄 Reactive System

The reactive system provides a Vue-like reactivity API with automatic dependency tracking and UI updates.

### Available Functions

#### `reactive(value)`

Creates a reactive proxy that automatically tracks dependencies and triggers effects when changed.

**Use when:** You need reactive state that automatically updates the UI.

```js
import { reactive } from ".app/reactive.js";

// Reactive primitives (wrapped in .value)
const counter = reactive(0);
const name = reactive("Alice");
counter.value++; // Triggers UI update

// Reactive objects (direct property access)
const state = reactive({ count: 0, user: "Alice" });
state.count++; // Triggers UI update
state.user = "Bob"; // Triggers UI update
```

#### `effect(fn)`

Creates a side effect that automatically re-runs when its reactive dependencies change.

**Use when:** You need to perform side effects (logging, API calls, DOM manipulation) based on reactive state.

```js
import { reactive, effect } from ".app/reactive.js";

const count = reactive(0);

// Effect runs immediately and on every count change
const cleanup = effect(() => {
  console.log(`Count is: ${count.value}`);
  document.title = `Count: ${count.value}`;
});

count.value++; // Effect runs again
count.value++; // Effect runs again

cleanup(); // Stop the effect
```

#### `computed(getter)`

Creates a computed reactive value that automatically recalculates when its dependencies change.

**Use when:** You need derived state that depends on other reactive values.

```js
import { reactive, computed } from ".app/reactive.js";

const price = reactive(100);
const quantity = reactive(2);

// Computed value automatically updates
const total = computed(() => price.value * quantity.value);

console.log(total.value); // 200
price.value = 150;
console.log(total.value); // 300 (automatically recalculated)
```

#### `watch(source, callback, options)`

Watches a reactive source and runs a callback when its value changes.

**Use when:** You need to react to specific state changes with custom logic (different from `effect`).

```js
import { reactive, watch } from ".app/reactive.js";

const count = reactive(0);

// Watch runs only when count changes (not immediately)
watch(
  () => count.value,
  (newValue, oldValue, onCleanup) => {
    console.log(`Count changed from ${oldValue} to ${newValue}`);
    
    // Cleanup function for previous effect
    onCleanup(() => {
      console.log('Cleaning up previous watch effect');
    });
  },
  { immediate: false } // Run immediately on setup
);

count.value++; // Callback runs
```

### In Components

```html
<script client>
  import { reactive, computed, effect, watch } from ".app/reactive.js";

  // Reactive state
  const count = reactive(0);
  const step = reactive(1);

  // Computed value
  const doubled = computed(() => count.value * 2);

  // Effect for side effects
  effect(() => {
    console.log(`Count changed to: ${count.value}`);
  });

  // Watcher for specific logic
  watch(
    () => count.value,
    (newVal, oldVal) => {
      if (newVal > 10) {
        console.warn('Count is getting high!');
      }
    }
  );

  function increment() {
    count.value += step.value;
  }
</script>

<template>
  <div>
    <p>Count: {{count}}</p>
    <p>Doubled: {{doubled}}</p>
    <p>Step: {{step}}</p>
    <button @click="increment">Increment by {{step}}</button>
  </div>
</template>
```

### Reactivity Comparison

| Function | When to Use | Auto-runs | Returns |
|----------|-------------|-----------|----------|
| `reactive()` | Create reactive state | No | Proxy object |
| `effect()` | Side effects (logging, DOM, etc.) | Yes (immediately + on changes) | Cleanup function |
| `computed()` | Derived/calculated values | Yes (on dependency change) | Reactive value |
| `watch()` | React to specific changes | Optional (with `immediate`) | Nothing |

## 📝 Template Syntax

Components use a template syntax that supports interpolation, directives, and event handlers.

> **Note:** The template syntax is inspired by Vue.js for educational purposes. This framework was created as a learning exercise to understand how modern frameworks work internally while practicing Vue.js concepts.

### Interpolation

```html
<template>
  <h1>Hello, {{name}}</h1>
  <p>Count: {{counter}}</p>
</template>
```

### Conditionals

```html
<template>
  <div v-if="isVisible">
    This is visible
  </div>
  <div v-else>
    This is hidden
  </div>
</template>
```

### Lists

```html
<template>
  <ul>
    <li v-for="item in items">
      {{item}}
    </li>
  </ul>
</template>
```

### Event Handlers

```html
<template>
  <button @click="increment">Click me</button>
  <input @input="handleInput" />
</template>
```

### Attributes

```html
<template>
  <button :disabled="counter <= 0">Decrement</button>
  <div :class="isActive ? 'active' : ''">Content</div>
</template>
```

## 🛣️ Routing

### Auto-Generated Routes

Routes are automatically generated from the `pages/` folder structure:

```
pages/
  ├── page.html              → /
  ├── page-ssr/page.html     → /page-ssr
  ├── page-csr/page.html     → /page-csr
  └── page-ssr/[city]/page.html → /page-ssr/:city (dynamic)
```

### Dynamic Routes

Create dynamic routes using `[param]` syntax:

```html
<!-- pages/page-ssr/[city]/page.html -->
<script server>
  import { useRouteParams } from ".app/navigation/use-route-params.js";

  async function getData() {
    const { city } = useRouteParams();
    // Fetch data based on city parameter
    return { city };
  }
</script>

<template>
  <h1>Weather for {{city}}</h1>
</template>
```

### Client-Side Navigation

```js
import { navigate } from ".app/navigation.js";

// Navigate without page reload
navigate("/page-ssr");
```

### Accessing Route Parameters

```js
import { useRouteParams } from ".app/navigation/use-route-params.js";
import { useQueryParams } from ".app/navigation/use-query-params.js";

// Get route parameters (/page/:id)
const { id } = useRouteParams();

// Get query parameters (?search=query)
const { search } = useQueryParams();
```

## ⚡ Prefetching

The framework automatically prefetches pages to improve navigation performance.

### Automatic Prefetching

Add the `data-prefetch` attribute to any link to prefetch the page when it enters the viewport:

```html
<template>
  <nav>
    <a href="/page-ssr" data-prefetch>SSR Page (Prefetched)</a>
    <a href="/page-csr" data-prefetch>CSR Page (Prefetched)</a>
    <a href="/static">Static Page (No prefetch)</a>
  </nav>
</template>
```

**How it works:**
1. Links with `data-prefetch` are observed using IntersectionObserver
2. When a link becomes visible, the page component is loaded in the background
3. Navigation to prefetched pages is instant (no loading delay)
4. Components are cached for subsequent navigations

**Benefits:**
- ⚡ Near-instant page transitions
- 🎯 Smart loading (only when visible)
- 💾 Automatic caching
- 🔄 Works with SPA navigation

**Example in layout:**
```html
<!-- pages/layout.html -->
<template>
  <header>
    <nav>
      <a href="/" data-prefetch>Home</a>
      <a href="/page-ssr" data-prefetch>SSR</a>
      <a href="/page-csr" data-prefetch>CSR</a>
      <a href="/static" data-prefetch>Static</a>
    </nav>
  </header>
</template>
```

**Performance tip:** Use prefetching for frequently accessed pages or important navigation paths.

## 🎨 Styling

The project uses **Tailwind CSS v4** via CDN for simplicity and zero configuration.

**Why CDN?** 
- ✅ No build step required
- ✅ Instant setup
- ✅ Automatic updates
- ✅ Perfect for prototyping and learning

**Usage:**

```html
<div class="flex items-center justify-center p-4 bg-blue-500">
  <h1 class="text-white text-2xl">Title</h1>
</div>
```

**Compilation:**

During development, Tailwind CLI watches your files and compiles styles:

```bash
pnpm dev  # Runs Tailwind in watch mode + server
```

The compiled CSS is automatically generated in `.app/client/styles.css`.

## 🔧 Framework API

### Component Props

```js
const props = vprops({
  userId: { required: true },
  count: { default: 0 },
  name: { default: "Guest" },
});
```

### Reactive State

```js
import { reactive, computed } from ".app/reactive.js";

// Reactive primitive
const count = reactive(0);
count.value++;

// Reactive object
const state = reactive({ name: "Alice", age: 25 });
state.name = "Bob";

// Computed values
const doubled = computed(() => count.value * 2);
```

### Navigation Utilities

```js
import { navigate } from ".app/navigation.js";
import { useRouteParams } from ".app/navigation/use-route-params.js";
import { useQueryParams } from ".app/navigation/use-query-params.js";

// Navigate to a route
navigate("/page-ssr/madrid");

// Access route params
const { city } = useRouteParams();

// Access query params
const { search } = useQueryParams();
```

## 📦 Available Scripts

```bash
pnpm dev          # Development server: builds + watches (auto-reloads on changes)
pnpm build        # Production build: generates routes, client bundles and minifies CSS
pnpm start        # Production server: requires a prior pnpm build
pnpm biome check --write .  # Format and lint with Biome
```

> ⚠️ `pnpm start` requires `pnpm build` to have been run first. In production the server loads pre-built routes from `_routes.js` without executing the build pipeline.

## 🏗️ Rendering Flow

### SSR (Server-Side Rendering)

```mermaid
---
config:
  theme: mc
---
sequenceDiagram
        autonumber
        participant Client
        participant Server
        participant Router
        participant ComponentProcessor
        participant Streaming
        participant Template
        participant Cache

        Client ->> Server: Request page (e.g., /page-ssr)
        Server ->> Router: handlePageRequest(req, res, route)
        Router ->> Router: Check if ISR enabled (route.meta.revalidate)
        
        alt ISR enabled and cache valid
            Router ->> Cache: getCachedComponentHtml(url, revalidateSeconds)
            Cache -->> Router: Cached HTML (if not stale)
            Router ->> Client: Send cached HTML
        else No cache or stale
            Router ->> ComponentProcessor: renderPageWithLayout(pagePath, context)
            ComponentProcessor ->> ComponentProcessor: renderPage(pagePath, context)
            ComponentProcessor ->> ComponentProcessor: processHtmlFile(filePath)
            Note over ComponentProcessor: Extract getData, metadata,<br/>template, clientCode,<br/>serverComponents, clientComponents
            ComponentProcessor ->> ComponentProcessor: getData(context)
            Note over ComponentProcessor: Fetch server-side data
            ComponentProcessor ->> Template: compileTemplateToHTML(template, data)
            Template ->> Template: parseHTMLToNodes & processNode
            Note over Template: Process Vue-like syntax:<br/>{{interpolation}}, v-if, v-for, etc.
            Template -->> ComponentProcessor: Compiled HTML
            ComponentProcessor ->> Streaming: renderComponents(html, serverComponents, clientComponents)
            Streaming ->> Streaming: renderServerComponents(html, serverComponents)
            Note over Streaming: Process <Suspense> boundaries<br/>Extract suspense components<br/>Render fallback content
            Streaming ->> Streaming: renderClientComponents(html, clientComponents)
            Note over Streaming: Replace client components with<br/>hydration templates<br/>Generate component scripts
            Streaming -->> ComponentProcessor: { html, suspenseComponents, clientComponentsScripts }
            ComponentProcessor ->> ComponentProcessor: generateClientScriptTags(...)
            Note over ComponentProcessor: Generate <script> tags for<br/>client code and components
            ComponentProcessor ->> ComponentProcessor: renderLayouts(pagePath, html, metadata)
            Note over ComponentProcessor: Wrap page in nested layouts<br/>(innermost to outermost)<br/>Then wrap in root.html
            ComponentProcessor -->> Router: { html, metadata, suspenseComponents, serverComponents }
            
            alt No suspense components
                Router ->> Client: sendResponse(res, statusCode, html)
                Router ->> Cache: saveCachedComponentHtml (if ISR)
            else Has suspense components (streaming)
                Router ->> Client: sendStartStreamChunkResponse(res, html_before_closing)
                Note over Router,Client: Stream initial HTML (before </body>)
                loop For each suspense component
                    Router ->> Streaming: renderSuspenseComponent(suspense, serverComponents)
                    Streaming ->> Streaming: processServerComponents(content, serverComponents)
                    Note over Streaming: Render server components<br/>inside suspense boundary
                    Streaming -->> Router: Rendered HTML content
                    Router ->> Router: generateReplacementContent(suspenseId, html)
                    Note over Router: Generate <template> + hydration script
                    Router ->> Client: sendStreamChunkResponse(res, replacement_html)
                end
                Router ->> Client: endStreamResponse(res) - Send </body></html>
                Router ->> Cache: saveCachedComponentHtml (if ISR and no errors)
            end
        end
```

### CSR (Client-Side Rendering)

```mermaid
---
config:
  theme: mc
---
sequenceDiagram
        autonumber
        participant User
        participant Browser
        participant Navigation
        participant Router
        participant Cache
        participant LayoutRenderer
        participant Component
        participant Hydrator

        User ->> Browser: Click link or initial page load
        Browser ->> Navigation: navigate(path)
        Navigation ->> Navigation: abortPrevious()
        Note over Navigation: Cancel any in-progress navigation
        Navigation ->> Router: findRouteWithParams(path)
        Router -->> Navigation: { route, params }
        Navigation ->> Navigation: updateRouteParams(params)
        Navigation ->> Navigation: history.pushState({}, "", path)
        
        alt Route is SSR (meta.ssr = true)
            Navigation ->> Navigation: layoutRenderer.reset()
            Navigation ->> Browser: fetch(path, { signal })
            Browser -->> Navigation: Response stream
            Navigation ->> Navigation: renderSSRPage(path, signal)
            Note over Navigation: Progressive rendering:<br/>- Parse <main><br/>- Parse <template><br/>- Execute <script><br/>- Update metadata
            Navigation ->> Hydrator: hydrateComponents()
            Note over Hydrator: Hydrate streamed components
        else Route is CSR (meta.ssr = false)
            alt route.meta.requiresAuth && !app.Store.loggedIn
                Navigation ->> Browser: location.href = "/account/login"
            else route.meta.guestOnly && app.Store.loggedIn
                Navigation ->> Browser: location.href = "/account"
            end
            Navigation ->> Cache: loadRouteComponent(route.path, route.component)
            
            alt Component cached
                Cache -->> Navigation: Cached module
            else Component not cached
                Cache ->> Component: Dynamic import(route.component)
                Component -->> Cache: Module with hydrateClientComponent
                Cache ->> Cache: routeCache.set(path, module)
                Cache -->> Navigation: Fresh module
            end
            
            Navigation ->> Component: module.hydrateClientComponent(marker)
            Component -->> Navigation: pageNode (DOM node)
            
            Navigation ->> LayoutRenderer: generate({ routeLayouts, pageNode, metadata })
            
            alt Layouts already rendered
                LayoutRenderer ->> LayoutRenderer: getNearestRendered(routeLayouts)
                Note over LayoutRenderer: Find nearest cached layout
                LayoutRenderer ->> LayoutRenderer: getLayoutsToRender()
                Note over LayoutRenderer: Only render new/changed layouts
            else No cached layouts
                LayoutRenderer ->> LayoutRenderer: loadLayoutModules(layouts)
                Note over LayoutRenderer: Import all layout modules
            end
            
            loop For each layout (innermost to outermost)
                LayoutRenderer ->> Component: layout.hydrateClientComponent(marker, { children })
                Component -->> LayoutRenderer: layoutNode wrapping children
                LayoutRenderer ->> LayoutRenderer: renderedLayouts.set(name, { node, children })
            end
            
            LayoutRenderer -->> Navigation: { layoutId, node, metadata }
            
            alt Layout already exists in DOM
                Navigation ->> LayoutRenderer: patch(layoutId, node)
                LayoutRenderer ->> Browser: Replace children in existing layout
            else New layout
                Navigation ->> Browser: root.appendChild(node)
            end
            
            Navigation ->> Browser: addMetadata(metadata)
            Note over Browser: Update <title> and meta tags
            Navigation ->> Hydrator: hydrateComponents()
            
            loop For each component marker
                Hydrator ->> Hydrator: Check data-hydrated attribute
                alt Not hydrated
                    Hydrator ->> Component: import(`/.app/client/_components/${name}.js`)
                    Component -->> Hydrator: Module
                    Hydrator ->> Component: module.hydrateClientComponent(marker, props)
                    Component -->> Hydrator: Hydrated component
                    Hydrator ->> Hydrator: marker.dataset.hydrated = "true"
                end
            end
        end
        
        Navigation ->> Navigation: currentNavigationController = null
        Navigation -->> User: Page rendered and interactive
```

### ISR (Incremental Static Regeneration)

```mermaid
---
config:
  theme: mc
---
sequenceDiagram
        autonumber
        participant Client
        participant Server
        participant Router
        participant Cache
        participant FileSystem
        participant ComponentProcessor

        Client ->> Server: Request page (e.g., /page-ssr/madrid)
        Server ->> Router: handlePageRequest(req, res, route)
        Router ->> Router: getRevalidateSeconds(route.meta.revalidate)
        
        alt revalidate = 'never' or false
            Note over Router: ISR disabled (Pure SSG)<br/>revalidateSeconds = -1
        else revalidate = number
            Note over Router: ISR enabled<br/>revalidateSeconds = number
        else revalidate = true
            Note over Router: ISR enabled<br/>revalidateSeconds = 60 (default)
        else revalidate = 0 or undefined
            Note over Router: No caching (SSR)<br/>revalidateSeconds = 0
        end
        
        alt ISR enabled (revalidateSeconds !== 0)
            Router ->> Cache: getCachedComponentHtml(url, revalidateSeconds)
            Cache ->> FileSystem: getComponentHtmlDisk(componentPath)
            
            alt Cache exists on disk
                FileSystem -->> Cache: { html, meta: { generatedAt, isStale } }
                Cache ->> Cache: Calculate if stale by time
                Note over Cache: staleByTime = (now - generatedAt) > revalidateSeconds * 1000
                Cache ->> Cache: isStale = meta.isStale || staleByTime
                Cache -->> Router: { html, isStale }
                
                alt Cache valid (!isStale)
                    Router ->> Client: sendResponse(res, 200, cachedHtml)
                    Note over Router,Client: Instant response from cache<br/>No regeneration needed
                else Cache stale (isStale = true)
                    Note over Router: Continue to regeneration<br/>Client waits for fresh content (blocking)
                end
            else No cache exists
                FileSystem -->> Cache: { html: null }
                Cache -->> Router: { html: null }
                Note over Router: First request - generate and cache
            end
        end
        
        alt Need to regenerate (no cache, stale, or ISR disabled)
            Router ->> ComponentProcessor: renderPageWithLayout(pagePath, context)
            ComponentProcessor ->> ComponentProcessor: Process page, fetch data, render
            ComponentProcessor -->> Router: { html, suspenseComponents, serverComponents }
            
            alt No suspense components
                Router ->> Client: sendResponse(res, 200, html)
                
                alt ISR enabled
                    Router ->> Cache: saveCachedComponentHtml(url, html)
                    Cache ->> FileSystem: saveComponentHtmlDisk(componentPath, html)
                    Note over FileSystem: Save HTML + metadata:<br/>{ generatedAt: Date.now(), isStale: false }
                    FileSystem -->> Cache: Saved successfully
                    Cache -->> Router: Cache updated
                end
            else Has suspense components (streaming)
                Router ->> Client: sendStartStreamChunkResponse(res, html_before_closing)
                Router ->> Router: Track htmlChunks[], abortedStream, errorStream
                
                loop For each suspense component
                    Router ->> ComponentProcessor: renderSuspenseComponent(suspense, serverComponents)
                    ComponentProcessor -->> Router: Rendered HTML content
                    Router ->> Router: generateReplacementContent(suspenseId, html)
                    Router ->> Client: sendStreamChunkResponse(res, replacement_html)
                    Router ->> Router: Append to htmlChunks[]
                end
                
                Router ->> Client: endStreamResponse(res) - Send </body></html>
                
                alt ISR enabled and no errors
                    Router ->> Cache: saveCachedComponentHtml(url, htmlChunks.join(''))
                    Cache ->> FileSystem: saveComponentHtmlDisk(componentPath, fullHtml)
                    Note over FileSystem: Save complete streamed HTML<br/>with metadata
                    FileSystem -->> Cache: Saved successfully
                    Cache -->> Router: Cache updated for next request
                end
            end
        end
        
        Note over Client,FileSystem: Next request within revalidation window<br/>will serve cached HTML instantly
```

**ISR Flow Summary:**

1. **Cache Check**: Verifies if cached HTML exists and if it's still valid
2. **Stale Detection**: Compares current time vs. generation time + revalidation seconds
3. **Instant Serve**: If cache is valid, serves immediately without regeneration
4. **Regeneration**: If cache is stale or missing, regenerates the page
5. **Background Save**: After regeneration, saves to cache for future requests
6. **Streaming Support**: Handles suspense components and saves complete HTML
7. **Error Handling**: Prevents caching if errors occur during streaming

### Server Startup

Shows how `index.js` behaves differently in production vs development.

```mermaid
---
config:
  theme: mc
---
sequenceDiagram
        autonumber
        participant CLI
        participant index.js
        participant Files
        participant ComponentProcessor
        participant RoutesFile as _routes.js (disk)

        CLI ->> index.js: node .app/server/index.js

        index.js ->> Files: initializeDirectories()
        Files -->> index.js: Directories ready (_cache/, _components/, ...)

        alt NODE_ENV = "production"
            index.js ->> RoutesFile: import("./utils/_routes.js")
            alt _routes.js exists (pnpm build was run)
                RoutesFile -->> index.js: { routes }
                Note over index.js: Routes loaded instantly<br/>No build work done
            else _routes.js not found
                index.js ->> CLI: ERROR: Run 'pnpm build' first
                index.js ->> index.js: process.exit(1)
            end
        else NODE_ENV != "production" (development)
            index.js ->> ComponentProcessor: generateComponentsAndFillCache()
            Note over ComponentProcessor: Scan pages/, render static HTML,<br/>generate client JS bundles
            ComponentProcessor -->> index.js: Components and cache ready
            index.js ->> ComponentProcessor: generateRoutes()
            ComponentProcessor ->> RoutesFile: Write server _routes.js
            ComponentProcessor ->> RoutesFile: Write client _routes.js
            ComponentProcessor -->> index.js: { serverRoutes }
        end

        index.js ->> index.js: registerSSRRoutes(app, serverRoutes)
        index.js ->> index.js: app.listen(PORT)
        index.js -->> CLI: Server running on port 3000
```

### Build Process

Shows what `pnpm build` does step by step.

```mermaid
---
config:
  theme: mc
---
flowchart TD
    A([pnpm build]) --> B[node .app/server/prebuild.js]
    B --> C[initializeDirectories\nCreate _cache/, _components/]
    C --> D[generateComponentsAndFillCache]

    D --> E[getPageFiles with layouts=true]
    E --> F[For each .html file in pages/]

    F --> G[processHtmlFile\nExtract server script, client script, template]
    G --> H[Execute server script\nget getData, getMetadata, getStaticPaths]
    H --> I{Has getStaticPaths?}

    I -->|Yes| J[getStaticPaths\nreturns array of params]
    I -->|No| K[Single path with empty params]

    J --> L[For each param set:\nrenderHtmlFile with req.params]
    K --> L

    L --> M{canCSR?\nneverRevalidate AND no server components\nAND no getData}
    M -->|Yes - CSR page| N[saveClientComponent\nGenerate .js bundle in _components/]
    M -->|No - SSR/ISR/SSG page| O[saveComponentHtmlDisk\nSave rendered HTML to _cache/]

    N --> P{Has nested server\nor client components?}
    O --> P
    P -->|Yes| Q[Recursively process\neach referenced component]
    P -->|No| R[Page done]
    Q --> R

    R --> S[generateRoutes]
    S --> T[getPageFiles without layouts]
    T --> U[For each page: getRouteFileData\nResolve canCSR, metadata, static paths]
    U --> V[saveServerRoutesFile\n.app/server/utils/_routes.js]
    U --> W[saveClientRoutesFile\n.app/client/services/_routes.js]

    V --> X[Tailwind CSS minify\n_input.css → styles.css]
    W --> X
    X --> Y([Build complete ✅])
```

**`canCSR` logic:** A page is treated as CSR (client-only bundle, no server HTML) when all three conditions are true:
- `revalidate` is `false` or `"never"` (i.e. never needs server refresh)
- No server components (`<script server>`) in the tree
- No `getData` function

Otherwise the page is SSR/ISR/SSG and its HTML is pre-rendered into `_cache/`.

### Client Hydration

Shows how `hydrate-client-components.js` mounts interactive components after the HTML is in the DOM.

```mermaid
---
config:
  theme: mc
---
sequenceDiagram
        autonumber
        participant HTML as Browser DOM
        participant Script as hydrate-client-components.js
        participant Observer as MutationObserver
        participant Module as _components/{name}.js

        HTML ->> Script: <script src="..."> loads (IIFE, non-module)
        Script ->> Observer: observe(document, childList + subtree)
        Note over Observer: Watches for nodes added by SSR streaming

        alt document.readyState = "loading"
            HTML -->> Script: DOMContentLoaded event fires
            Script ->> Script: hydrateComponents(document)
            Script ->> Observer: disconnect()
            Note over Observer: Streaming content already parsed,<br/>observer no longer needed
        else document already interactive
            Script ->> Script: hydrateComponents(document) immediately
        end

        loop For each [data-client:component]:not([data-hydrated="true"])
            Script ->> Script: Read data-client:component (component name/hash)
            Script ->> Script: JSON.parse(data-client:props)
            Script ->> Module: import(/.app/client/_components/${name}.js)
            Module -->> Script: { hydrateClientComponent }
            Script ->> Module: hydrateClientComponent(marker, props)
            Note over Module: Replaces <template> marker with<br/>reactive DOM, binds events
            Script ->> Script: marker.dataset.hydrated = "true"
        end

        Note over Script: window.hydrateComponents exposed globally<br/>Called by SPA navigation after each route change
```

**Key detail:** The `<script>` tag that loads this file has no `type="module"` — it's an IIFE that runs synchronously and exposes `window.hydrateComponents` for the SPA router to call after each navigation.

## 🗺️ Roadmap

Future features planned for implementation:

- [x] **Language sintaxis** - Unify sintaxis to use same conditional tags, lists, etc in server and client.
- [x] **Inject client component script** - Use other technique to inject js in client, to avoid have scripts in html, check Nextjs, svelte, vue
- [x] **Metadata dynamic** - Optional add export func if the user wants to fetch. Also this func can receive the result of getData to not repeat the same fetch
- [x] **Add dynamic pages CSR and SSR** - Add dynamic routes
- [x] **Incremental Static Regeneration / Static Pages** - Regenerate static pages on-demand / never
- [x] **Generate Static Params** - Pre-generate pages with dynamic routes at build time
- [x] **Auto generated routes** - Auto generate server and client routes
- [x] **Unify fs methods** - Same constants files, unify fs functions in files, unify comments, etc
- [x] **Cache getData** - Implement caching layer for data fetching functions
- [x] **Cache Server Pages** - Cache rendered server pages for improved performance
- [x] **Link Component** - Custom link component with prefetching capabilities
- [x] **Prefetch Pages** - Automatically prefetch pages on link hover/visibility
- [x] **Restructure Directories** - Optimize project structure and organization
- [x] **Auto-generated Files** - Automatic generation of routes, utility files, and configurations based on code and pages directories
- [x] **Auto-generated Components** - Automatic generation components only based on pages imports
- [x] **Optimize auto generated routes**
- [x] **Layouts** - Layouts inside sub routes
- [ ] **Regeneration in background** - Regenerate page after send response (locks)
- [ ] **Change syntax**
- [ ] **Create NPM extension package** - Extension to recognize sintax
- [ ] **Use custom extension** - custom extension to have correct imports, lint, colors, etc.
- [ ] **Create NPM package** - Create package to save all logic framework and reused it in other projects
- [ ] **Cache with CDN**
- [ ] **Fix error replace marker** Only occurs when template has multiple childs no wrapped in div /fragment
- [ ] **Authentication** - Built-in authentication system with middleware support
