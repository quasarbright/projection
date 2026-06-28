# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

**Projection** is an npm CLI package (`@quasarbright/projection`) that generates static portfolio/gallery sites from a `projects.yaml` file. Users install it globally and run `projection <command>` in their own project directories.

## Commands

```bash
# Build TypeScript to lib/ and copy templates + admin client
npm run build

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run a single test file
npm test -- path-resolver.test.ts

# Admin UI development (server + React client hot reload)
npm run admin:dev
```

After making changes, re-run `npm run build` and use `npm link` to test the CLI locally. Create a sibling test portfolio with `projection init` to manually test.

## Architecture

### Source layout (`src/`)

- **`cli/`** — One file per CLI command (`init`, `build`, `dev`, `serve`, `admin`, `deploy`). `index.ts` houses the `CLI` class that parses args and dispatches to these handlers.
- **`generator/`** — Core site generation: `config.ts` loads `projection.config.json`, `validator.ts` validates project data, `html-builder.ts` renders `index.html`, `asset-copier.ts` resolves and copies styles/scripts/assets using template priority (user files override bundled defaults).
- **`admin/server/`** — Express server for the admin UI. Manages `projects.yaml` / `.json` via `yaml-file-manager.ts` / `json-file-manager.ts`, handles image uploads (`image-manager.ts`), and serves the React client build.
- **`admin/client/`** — React frontend for the admin UI (separate `package.json`, built independently via `npm run admin:build`). **Excluded from the root `tsconfig.json`.**
- **`templates/`** — Two subdirectories:
  - `init/` — Template files copied into a new user project on `projection init` (`.template` suffix stripped).
  - `default/` — Bundled default `styles/` and `scripts/` used when the user hasn't provided their own.
- **`types/`** — Shared TypeScript types.

### Build output (`lib/`)

TypeScript compiles to `lib/` (mirrors `src/`). Templates are not compiled — they're copied verbatim by `npm run copy-templates`. The `lib/` directory is what gets published to npm.

### Template resolution priority

When generating a site, asset-copier checks for user-provided files first (`styles/`, `scripts/`, `assets/` in the user's CWD), falling back to `lib/templates/default/`. This allows users to override individual files without replacing everything.

### Tests (`tests/`)

- `tests/unit/` — Unit tests for isolated modules (path resolver, git helper, deployment config).
- `tests/integration/` — Integration tests (use supertest against the Express admin server).
- Jest is configured via `jest.config.js` with `ts-jest`; test files live under `tests/` not `src/`.
