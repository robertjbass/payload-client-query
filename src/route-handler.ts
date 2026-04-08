import type { CollectionSlug, Payload, SelectType, Where } from 'payload'

export type CreateRouteHandlerOptions = {
  getPayload: () => Promise<Payload>
  overrideAccess?: boolean
}

type FindParams = {
  collection: CollectionSlug
  overrideAccess: boolean
  where?: Where
  limit?: number
  page?: number
  sort?: string | string[]
  depth?: number
  populate?: Record<string, any>
  select?: SelectType
  pagination?: boolean
  draft?: boolean
  locale?: string
  fallbackLocale?: string
  joins?: Record<string, any>
}

function isNonEmptyObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.keys(value).length > 0
  )
}

export function createPayloadRouteHandler(options: CreateRouteHandlerOptions) {
  const overrideAccess = options.overrideAccess ?? false

  return async function POST(request: Request): Promise<Response> {
    let body: Record<string, unknown>
    try {
      const text = await request.text()
      if (!text.trim()) {
        return Response.json(
          { status: 400, message: 'Empty request body', data: null },
          { status: 400 },
        )
      }
      body = JSON.parse(text)
    } catch {
      return Response.json(
        { status: 400, message: 'Invalid JSON in request body', data: null },
        { status: 400 },
      )
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return Response.json(
        {
          status: 400,
          message: 'Request body must be a JSON object',
          data: null,
        },
        { status: 400 },
      )
    }

    const { collection } = body

    if (!collection || typeof collection !== 'string') {
      return Response.json(
        { status: 400, message: 'Missing or invalid collection', data: null },
        { status: 400 },
      )
    }

    try {
      const payload = await options.getPayload()

      const findParams: FindParams = {
        collection: collection as CollectionSlug,
        overrideAccess,
      }

      if (isNonEmptyObject(body.where)) {
        findParams.where = body.where as Where
      }

      if (typeof body.limit === 'number' && Number.isFinite(body.limit)) {
        findParams.limit = body.limit
      }

      if (typeof body.page === 'number' && Number.isFinite(body.page)) {
        findParams.page = body.page
      }

      if (
        typeof body.sort === 'string' ||
        (Array.isArray(body.sort) &&
          body.sort.every((s: unknown) => typeof s === 'string'))
      ) {
        findParams.sort = body.sort as string | string[]
      }

      if (typeof body.depth === 'number' && Number.isFinite(body.depth)) {
        findParams.depth = body.depth
      }

      if (isNonEmptyObject(body.populate)) {
        findParams.populate = body.populate as Record<string, any>
      }

      if (isNonEmptyObject(body.select)) {
        findParams.select = body.select as SelectType
      }

      if (typeof body.pagination === 'boolean') {
        findParams.pagination = body.pagination
      }

      if (typeof body.draft === 'boolean') {
        findParams.draft = body.draft
      }

      if (typeof body.locale === 'string' && body.locale.length > 0) {
        findParams.locale = body.locale
      }

      if (
        typeof body.fallbackLocale === 'string' &&
        body.fallbackLocale.length > 0
      ) {
        findParams.fallbackLocale = body.fallbackLocale
      }

      if (isNonEmptyObject(body.joins)) {
        findParams.joins = body.joins as Record<string, any>
      }

      const data = await payload.find(findParams)

      return Response.json({
        status: 200,
        message: 'Success',
        data,
      })
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'An unknown error occurred'

      return Response.json(
        { status: 500, message, data: null },
        { status: 500 },
      )
    }
  }
}
