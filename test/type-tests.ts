// Type-level tests - these are checked at compile time, not at runtime.
// If this file compiles, the types are correct. If any line has a
// type error, the test fails via `pnpm test:types`.

import { createPayloadClient } from '../src/index.js'

// Simulated Payload Config (mirrors what payload generate:types produces)
type TestConfig = {
  collections: {
    posts: {
      id: number
      title: string
      slug: string
      content: any
      _status: 'draft' | 'published'
      author: number | { id: number; name: string }
      tags: ('news' | 'tutorial' | 'announcement')[] | null
      createdAt: string
      updatedAt: string
    }
    users: {
      id: number
      name: string
      email: string
      role: 'admin' | 'editor' | 'viewer'
      createdAt: string
      updatedAt: string
    }
    media: {
      id: number
      filename: string
      url: string
      alt: string
      createdAt: string
      updatedAt: string
    }
  }
}

const client = createPayloadClient<TestConfig>()

// === VALID QUERIES ===

// Basic find
async function testBasicFind() {
  const result = await client.find({ collection: 'posts' })
  const _doc: TestConfig['collections']['posts'] = result.docs[0]
  const _title: string = _doc.title
}

// Where clause with operators
async function testWhereOperators() {
  await client.find({
    collection: 'posts',
    where: {
      _status: { equals: 'published' },
      title: { like: 'hello' },
      createdAt: { greater_than: '2024-01-01' },
    },
  })
}

// Where clause with and/or
async function testWhereAndOr() {
  await client.find({
    collection: 'posts',
    where: {
      or: [
        { _status: { equals: 'draft' } },
        { title: { contains: 'test' } },
      ],
    },
  })
}

// Select fields
async function testSelect() {
  await client.find({
    collection: 'posts',
    select: { title: true, slug: true, _status: false },
  })
}

// Populate fields
async function testPopulate() {
  await client.find({
    collection: 'posts',
    populate: {
      users: { name: true, email: true },
      media: { url: true, alt: true },
    },
  })
}

// All standard params
async function testAllParams() {
  await client.find({
    collection: 'posts',
    where: { _status: { equals: 'published' } },
    select: { title: true },
    populate: { media: { url: true } },
    sort: '-createdAt',
    limit: 10,
    page: 1,
    depth: 2,
    pagination: true,
    draft: false,
    locale: 'en',
    fallbackLocale: 'en',
    joins: {},
  })
}

// HasMany select field - equals works on individual elements
async function testHasManyEquals() {
  await client.find({
    collection: 'posts',
    where: {
      tags: { equals: 'news' },
    },
  })
}

// Dot-path where clauses
async function testDotPath() {
  await client.find({
    collection: 'posts',
    where: {
      'author.name': { equals: 'Bob' },
    },
  })
}

// Different collection
async function testDifferentCollection() {
  const result = await client.find({
    collection: 'users',
    where: { role: { equals: 'admin' } },
  })
  const _user: TestConfig['collections']['users'] = result.docs[0]
  const _name: string = _user.name
}

// === INVALID QUERIES (should error) ===
// Uncomment any line below to verify it produces a type error.

// Non-existent collection:
// await client.find({ collection: 'nonexistent' })

// Wrong field name in where:
// await client.find({ collection: 'posts', where: { nonexistent: { equals: 'x' } } })

// Wrong field name in select:
// await client.find({ collection: 'posts', select: { nonexistent: true } })

// Suppress unused variable warnings
void testBasicFind
void testWhereOperators
void testWhereAndOr
void testSelect
void testPopulate
void testAllParams
void testHasManyEquals
void testDotPath
void testDifferentCollection
