import { type PaginatedDocs } from 'payload'
import type { PayloadQueryParams, PayloadQueryResponse } from './types.js'

export type CreatePayloadClientOptions = {
  endpoint?: string
  headers?:
    | (() => Promise<Record<string, string>> | Record<string, string>)
    | Record<string, string>
}

export function createPayloadClient<
  TConfig extends { collections: Record<string, any> },
>(options?: CreatePayloadClientOptions) {
  const endpoint = options?.endpoint ?? '/api/payload'

  async function resolveHeaders(): Promise<Record<string, string>> {
    const custom =
      typeof options?.headers === 'function'
        ? await options.headers()
        : (options?.headers ?? {})

    return {
      'Content-Type': 'application/json',
      ...custom,
    }
  }

  async function find<T extends keyof TConfig['collections'] & string>(
    params: PayloadQueryParams<TConfig, T>,
  ): Promise<PaginatedDocs<TConfig['collections'][T]>> {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: await resolveHeaders(),
      credentials: 'include',
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      throw new Error(`Payload query failed with status ${response.status}`)
    }

    const json = (await response.json()) as PayloadQueryResponse<TConfig, T>

    if (json.status !== 200) {
      throw new Error(`Payload query failed: ${json.status} - ${json.message}`)
    }

    return json.data
  }

  return { find }
}
