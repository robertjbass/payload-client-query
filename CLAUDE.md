# CLAUDE.md

## Git Workflow

- `main` is the protected release branch. All changes go through PRs.
- PRs to `main` must bump the version in `package.json` to pass the version check.

## What This Is

`payload-client-query` is a type-safe client for querying Payload CMS from frontend (`'use client'`) components. It mirrors Payload's Local API surface (`payload.find`, `payload.findByID`, etc.) but works over HTTP via a POST route handler.

## Architecture

Two pieces:

1. **Client** (`src/client.ts`) - A factory that returns a typed object with query methods. Uses `fetch` internally, sends JSON to the route handler endpoint.

2. **Route Handler** (`src/route-handler.ts`) - A server-side POST handler factory that receives the typed query params, calls `payload.find()` with `overrideAccess: false`, and returns the result.

The types in `src/types.ts` are generic over Payload's generated `Config` type, so consumers get full autocomplete on collection names, where clauses, select fields, and populate fields.

## Code Conventions

- TypeScript, ESM (`"type": "module"`)
- Use `type` instead of `interface`
- Use `function` keyword for named functions, arrow functions only for callbacks
- kebab-case file names
- No barrel file re-exports except `src/index.ts` (the package entrypoint)
- `payload` is a peer dependency, not bundled
- Standard Web APIs (`Request`/`Response`) in the route handler, not framework-specific imports

## Key Commands

- `pnpm build` - Compile TypeScript to `dist/`
- `pnpm typecheck` - Type check without emitting
- `pnpm format` - Run Prettier

## Adding New Methods

Each new method (e.g. `findByID`, `count`, `create`) needs changes in three places:

1. **`src/types.ts`** - Add parameter and response types for the method
2. **`src/client.ts`** - Add the method to the returned object from `createPayloadClient`
3. **`src/route-handler.ts`** - Add an `action` discriminator to the request body and handle the new action in the POST handler

The route handler currently only handles `find` (via `payload.find()`). When adding new methods, add an `action` field to the request body (defaulting to `'find'` for backwards compatibility) and dispatch to the appropriate Payload Local API method.

## Design Principles

- Mirror Payload's Local API naming and parameter shapes as closely as possible
- The client should feel like using `payload.find()` directly, just from the browser
- Keep the package minimal - no logging, no caching, no framework-specific code
- All type safety comes from the consumer's generated `Config` type via generics
