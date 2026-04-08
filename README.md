# payload-client-query

Type-safe client for querying [Payload CMS](https://payloadcms.com) from frontend components. Mirrors the Payload Local API surface so the mental model is familiar.

## Installation

```bash
pnpm add payload-client-query
```

`payload` is a peer dependency - use whatever version your project already has.

## Quick Start

### 1. Create the route handler

The client sends queries to a POST endpoint that bridges to Payload's Local API. Create this route in your Next.js app (or any framework):

```ts
// app/api/payload/route.ts
import { createPayloadRouteHandler } from 'payload-client-query'
import { getPayload } from '@/lib/payload'

export const POST = createPayloadRouteHandler({
  getPayload: () => getPayload(),
})
```

The route handler uses `overrideAccess: false` by default, so all queries respect your collection access control.

### 2. Create the client

```ts
// lib/payload-client.ts
import { createPayloadClient } from 'payload-client-query'
import type { Config } from '@/payload-types'

export const payloadClient = createPayloadClient<Config>()
```

### 3. Query from client components

```ts
'use client'
import { payloadClient } from '@/lib/payload-client'

const { docs } = await payloadClient.find({
  collection: 'posts',
  where: { _status: { equals: 'published' } },
  select: { title: true, slug: true },
  limit: 10,
})
```

All parameters are fully typed - collection names, where clause fields and operators, select fields, and populate fields are all inferred from your generated Payload types.

## API

### `createPayloadClient<Config>(options?)`

Creates a typed client instance.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `endpoint` | `string` | `'/api/payload'` | The URL of the route handler |
| `headers` | `Record<string, string>` or `() => Record<string, string>` | `{}` | Static headers or an async function that returns headers (for cookies, auth tokens, etc.) |

Returns an object with query methods.

### `payloadClient.find(params)`

Mirrors `payload.find()`. Accepts all the same parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| `collection` | `string` | Collection slug (typed from your Config) |
| `where` | `WhereCondition` | Type-safe where clause with operators |
| `select` | `SelectFields` | Fields to include in the response |
| `populate` | `PopulateFields` | Relationship fields to populate |
| `sort` | `string \| string[]` | Sort field(s), prefix with `-` for descending |
| `limit` | `number` | Maximum documents to return |
| `page` | `number` | Page number for pagination |
| `depth` | `number` | Population depth |
| `pagination` | `boolean` | Enable/disable pagination |

Returns `Promise<PaginatedDocs<T>>`.

### `createPayloadRouteHandler(options)`

Creates the server-side POST handler.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `getPayload` | `() => Promise<Payload>` | **required** | Function that returns your Payload instance |
| `overrideAccess` | `boolean` | `false` | Override access control (use with caution) |

## Custom Headers

Pass cookies, auth tokens, or other headers to every request:

```ts
const payloadClient = createPayloadClient<Config>({
  headers: async () => {
    const { cookies } = await import('next/headers')
    return { cookie: (await cookies()).toString() }
  },
})
```

Or static headers:

```ts
const payloadClient = createPayloadClient<Config>({
  headers: { Authorization: `Bearer ${token}` },
})
```

## Roadmap

The goal is to mirror the full Payload Local API surface for client-side use:

- [x] `payloadClient.find()` - Query collections with full type safety
- [ ] `payloadClient.findByID()` - Fetch a single document by ID
- [ ] `payloadClient.count()` - Count documents matching a query
- [ ] `payloadClient.create()` - Create a new document
- [ ] `payloadClient.update()` - Update a document by ID
- [ ] `payloadClient.updateMany()` - Update documents matching a query
- [ ] `payloadClient.delete()` - Delete a document by ID
- [ ] `payloadClient.deleteMany()` - Delete documents matching a query

## License

MIT
