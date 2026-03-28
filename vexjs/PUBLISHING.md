# Publishing @cfdez11/vex

## Prerequisites

- npm account with access to `@cfdez11` scope
- Logged in: `npm whoami` should return your username. If not: `npm login`

## Steps

### 1. Update the version

In `package.json`, bump the version following semver:

- **patch** `0.8.3 → 0.8.4` — bug fixes
- **minor** `0.8.3 → 0.9.0` — new features, backwards compatible
- **major** `0.8.3 → 1.0.0` — breaking changes

Or use npm to do it automatically:

```bash
npm version patch   # or minor / major
```

### 2. Build dist/

```bash
node build-dist.js
```

Verify the output looks correct in `dist/`. This step runs automatically via `prepublishOnly` on publish, but running it manually first lets you catch issues early.

### 3. Publish

```bash
npm publish --access public
```

`prepublishOnly` will run `build-dist.js` automatically before publishing. Only the `dist/` folder is included in the package.

### 4. Tag the release in git

```bash
git tag v0.8.4
git push origin v0.8.4
```

---

## What gets published

Only the `dist/` folder (plus `README.md` and `package.json` which npm always includes).

The `dist/` build:
- Strips all comments and JSDoc
- Minifies whitespace and syntax
- Preserves export names (no identifier mangling)
- Excludes `favicon.ico`

Source files in `server/`, `client/`, and `bin/` are never published — they stay in git with all comments intact.

## What stays in git but is NOT published

- `server/`, `client/`, `bin/` — full source with comments
- `build-dist.js` — the build script itself
- `PUBLISHING.md` — this file
- `README.md` — published separately by npm automatically
