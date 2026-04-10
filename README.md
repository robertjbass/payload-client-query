# payload-client-query

Type-safe client for querying [Payload CMS](https://payloadcms.com) from client-side (`'use client'`) components. Mirrors the Payload Local API surface so the mental model is familiar.

## Why?

Payload's Local API (`payload.find()`, `payload.findByID()`, etc.) only works server-side. If you need to fetch data from a client component, you're stuck writing raw `fetch` calls against the REST API with no type safety.

This package gives you a typed client that works like the Local API but runs over HTTP:

```ts
// Server-side (Payload Local API)
const { docs } = await payload.find({ collection: 'posts', where: { _status: { equals: 'published' } } })

// Client-side (this package)
const { docs } = await payloadClient.find({ collection: 'posts', where: { _status: { equals: 'published' } } })
```

Collection names, where clause fields, operators, select fields, and populate fields are all inferred from your generated Payload types.

## Installation

```bash
pnpm add payload-client-query
```

`payload` is a peer dependency. Use whatever version your project already has.

## Setup with Next.js

### 1. Create the route handler

The client sends queries to a POST endpoint that bridges to Payload's Local API.

First, create a helper that returns your Payload instance (if you don't already have one):

```ts
// lib/payload.ts
import { getPayload as getPayloadInstance } from 'payload'
import config from '@payload-config'

export async function getPayload() {
  return getPayloadInstance({ config })
}
```

Then create the route handler:

```ts
// app/api/payload/route.ts
import { createPayloadRouteHandler } from 'payload-client-query'
import { getPayload } from '@/lib/payload'

export const POST = createPayloadRouteHandler({
  getPayload,
})
```

The route handler uses `overrideAccess: false` by default, so all queries respect your collection access control.

### 2. Create the client

For a basic setup without custom headers:

```ts
// lib/payload-client.ts
import { createPayloadClient } from 'payload-client-query'
import type { Config } from '@/payload-types'

export const payloadClient = createPayloadClient<Config>()
```

For production Next.js apps, you'll typically want cookie forwarding for SSR and (if deploying on Vercel) a protection bypass header for preview deployments:

```ts
// lib/payload-client.ts
import { createPayloadClient } from 'payload-client-query'
import type { Config } from '@/payload-types'

const isServer = typeof window === 'undefined'
const bypassSecret = process.env.NEXT_PUBLIC_VERCEL_AUTOMATION_BYPASS_SECRET

export const payloadClient = createPayloadClient<Config>({
  headers: async () => {
    const headers: Record<string, string> = {}

    // Forward cookies when running server-side (SSR/RSC)
    // so the route handler sees the user's auth session
    if (isServer) {
      const { cookies } = await import('next/headers')
      const cookie = (await cookies()).toString()
      if (cookie) headers.cookie = cookie
    }

    // Bypass Vercel authentication on preview deployments
    if (bypassSecret) {
      headers['x-vercel-protection-bypass'] = bypassSecret
    }

    return headers
  },
})
```

### 3. Query from client components

```tsx
'use client'

import { useEffect, useState } from 'react'
import { payloadClient } from '@/lib/payload-client'
import type { Post } from '@/payload-types'

export function PostList() {
  const [posts, setPosts] = useState<Post[]>([])

  useEffect(() => {
    async function fetchPosts() {
      const { docs } = await payloadClient.find({
        collection: 'posts',
        where: { _status: { equals: 'published' } },
        select: { title: true, slug: true },
        limit: 10,
      })
      setPosts(docs)
    }
    fetchPosts()
  }, [])

  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}
```

## API

### `createPayloadClient<Config>(options?)`

Creates a typed client instance.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `endpoint` | `string` | `'/api/payload'` | The URL of the route handler |
| `headers` | `Record<string, string>` or `() => Record<string, string>` | `{}` | Static headers or async function returning headers (for cookies, auth tokens, etc.) |

Returns an object with query methods.

### `payloadClient.find(params)`

Mirrors `payload.find()`. Returns `Promise<PaginatedDocs<T>>`.

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
| `draft` | `boolean` | Include draft documents |
| `locale` | `string` | Locale for localized fields |
| `fallbackLocale` | `string` | Fallback locale |
| `joins` | `object` | Join field queries |

### `createPayloadRouteHandler(options)`

Creates the server-side POST handler. Uses standard Web API `Request`/`Response`, so it works with Next.js, Hono, SvelteKit, or any framework.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `getPayload` | `() => Promise<Payload>` | **required** | Function that returns your Payload instance |
| `overrideAccess` | `boolean` | `false` | Override access control (use with caution) |

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
